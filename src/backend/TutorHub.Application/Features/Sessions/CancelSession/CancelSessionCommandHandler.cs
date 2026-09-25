using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.Scheduling;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.CancelSession;

public class CancelSessionCommandHandler : IRequestHandler<CancelSessionCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStudentWalletService _studentWalletService;
    private readonly IConfiguration _configuration;

    public CancelSessionCommandHandler(
        IAppDbContext context,
        IClock clock,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService,
        IStudentWalletService studentWalletService,
        IConfiguration configuration)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
        _studentWalletService = studentWalletService;
        _configuration = configuration;
    }

    public async Task<SessionDto> Handle(CancelSessionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var policy = new SessionSchedulePolicy(_configuration, _clock);

        var session = await _context.Sessions
            .Include(s => s.Enrollment)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Authorization: only a participant of the enrollment.
        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile)
            .Include(e => e.TutorProfile)
            .Include(e => e.Sessions)
            .FirstOrDefaultAsync(e => e.Id == session.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", session.EnrollmentId);
        }

        if (enrollment.StudentProfile.UserId != userId &&
            enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to cancel this session.");
        }

        // 2. Enrollment must be Active (F-19 gate, no finance: a Pending
        // enrollment has nothing scheduled yet; use enrollment cancel instead).
        if (enrollment.Status != EnrollmentStatus.Active)
        {
            throw new ConflictException($"Cannot cancel a session of an enrollment in '{enrollment.Status}' status.");
        }

        // 3. Domain gate: Unscheduled, or Scheduled with future StartAt. Completed /
        // Cancelled / started sessions are rejected inside CancelSingle (→ 409 via handler mapping).
        var now = _clock.UtcNow;
        var oldStatus = session.Status;
        try
        {
            session.CancelSingle(request.Reason, now);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        // 3b. Minimum-notice rule for a Scheduled session (Unscheduled sessions
        // need no notice). Reuse the scheduling policy so the math lives in one
        // place. Runs after CancelSingle so an already-started session still maps
        // to Conflict above, preserving existing behavior. Nothing is persisted
        // yet, so throwing here leaves the session untouched.
        if (oldStatus == SessionStatus.Scheduled &&
            session.StartAt is { } startAt && session.EndAt is { } endAt)
        {
            policy.RequireSchedulable(startAt, endAt, "cancelled");
        }

        // 4. Re-evaluate the contract lifecycle: the last unresolved Session may
        // now be terminal, allowing the Enrollment to complete (FR-ENR-005).
        enrollment.EvaluateCompletion();

        // 5. Financial Escrow Adjustment & Refund Record (INV-LEDGER-006, INV-REFUND-004)
        // Lock the tutor wallet row so concurrent payouts/cancellations cannot race pending-escrow.
        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            if (session.EarningAmount > 0)
            {
                var wallet = await _context.Wallets
                    .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {enrollment.TutorProfileId} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);

                if (wallet != null)
                {
                    wallet.DebitPending(session.EarningAmount, now);
                }
                else
                {
                    throw new InvalidOperationException("Financial invariant violated: Tutor wallet not found for escrow debit during single session cancellation.");
                }

                // Credit refund directly into Student Wallet (Holding -> Student Wallet)
                await _studentWalletService.CreditRefundAsync(
                    enrollment.StudentProfileId,
                    session.EarningAmount,
                    "SessionCancellation",
                    session.Id,
                    $"Hoàn tiền hủy buổi học: {request.Reason.Trim()}",
                    now,
                    cancellationToken);

                var refundTx = Transaction.CreateRefund(
                    bookingId: enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: null,
                    originalPayout: null,
                    amount: session.EarningAmount,
                    paymentGatewayRef: $"WalletRefund-Session-{session.Id:N}",
                    description: $"Single session cancellation refund: {request.Reason.Trim()}",
                    now: now);
                refundTx.Status = TransactionStatus.Succeeded;
                refundTx.RefundedAt = now;
                refundTx.SettlementRequired = false;
                _context.Transactions.Add(refundTx);

                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(session.EarningAmount),
                    refundTx.Id,
                    Guid.NewGuid(),
                    1,
                    now));

                _context.AddOutboxMessage(new RefundCompletedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(session.EarningAmount),
                    refundTx.Id,
                    Guid.NewGuid(),
                    1,
                    now));
            }

            _context.AddOutboxMessage(new SessionCancelledEvent(
                session.Id,
                enrollment.Id,
                enrollment.StudentProfile.UserId,
                enrollment.TutorProfile.UserId,
                request.Reason));

            await _auditLogService.LogAsync(
                action: "SESSION_CANCELLED",
                entityName: "Session",
                entityId: session.Id.ToString(),
                userId: userId,
                oldValues: new { status = oldStatus.ToString() },
                newValues: new { status = "Cancelled", reason = request.Reason, refundAmount = session.EarningAmount },
                cancellationToken: cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        // F-23 (Đợt 4): centralized mapping.
        return SessionMapper.ToDto(session);
    }
}
