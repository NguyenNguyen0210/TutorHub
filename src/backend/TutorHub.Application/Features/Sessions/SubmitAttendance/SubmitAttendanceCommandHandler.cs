using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Sessions.SubmitAttendance;

public class SubmitAttendanceCommandHandler : IRequestHandler<SubmitAttendanceCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public SubmitAttendanceCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(SubmitAttendanceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.Sessions)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        var isStudent = session.Enrollment.StudentProfile.UserId == userId;
        var isTutor = session.Enrollment.TutorProfile.UserId == userId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("You do not have permission to submit attendance for this session.");
        }

        if (session.Enrollment.Status != EnrollmentStatus.Active)
        {
            throw new BadRequestException("Cannot submit attendance for an inactive or cancelled enrollment.");
        }

        if (session.Status == SessionStatus.Unscheduled)
        {
            throw new BadRequestException("Cannot submit attendance for an unscheduled session.");
        }

        if (session.Status == SessionStatus.Completed)
        {
            throw new ConflictException("Session is already completed.");
        }

        if (session.Status == SessionStatus.Cancelled)
        {
            throw new ConflictException("Cannot submit attendance for a cancelled session.");
        }

        var now = _clock.UtcNow;

        if (session.EndAt.HasValue && session.EndAt.Value > now)
        {
            throw new BadRequestException("Attendance verification can only be submitted after the session has ended.");
        }

        // One immutable attendance outcome per side (FR-ATT-001/002). Re-submission
        // is rejected to prevent strike farming and outcome overwrites; corrections
        // go through Admin/dispute resolution.
        if (isStudent && session.StudentAttendanceSubmittedAt.HasValue)
        {
            throw new ConflictException("You have already submitted attendance for this session.");
        }

        if (isTutor && session.TutorAttendanceSubmittedAt.HasValue)
        {
            throw new ConflictException("You have already submitted attendance for this session.");
        }

        if (isStudent)
        {
            session.SubmitStudentAttendance(request.Outcome, now);
        }
        else
        {
            session.SubmitTutorAttendance(request.Outcome, now);
        }

        // No-show discipline (Q1b): a self-recorded Absent is an admission of
        // absence and earns the submitter a strike. Silence is never judged.
        if (request.Outcome == AttendanceStatus.Absent)
        {
            var absentUser = isStudent
                ? session.Enrollment.StudentProfile.User
                : session.Enrollment.TutorProfile.User;
            absentUser?.RecordAbsentStrike(now);
        }

        // FR-DISPUTE-003 / FR-EARN-004 / INV-003: while a dispute is active the
        // session's escrow must stay locked. Matching attendance is recorded but
        // the payout is not released until Admin resolves the dispute.
        var hasActiveDispute = await _context.Disputes
            .AsNoTracking()
            .AnyAsync(d => d.SessionId == session.Id
                && d.Status != DisputeStatus.Resolved
                && d.Status != DisputeStatus.Dismissed, cancellationToken);

        if (session.StudentAttendance == AttendanceStatus.Attended &&
            session.TutorAttendance == AttendanceStatus.Attended &&
            !hasActiveDispute)
        {
            session.Complete();
            session.Enrollment.RecordCompletedSession(session.Id);

            // Progressive earning: Gross - snapshot PlatformFeeRate = Net (DEC-S8-020).
            var gross = session.EarningAmount;
            var commissionRate = session.Enrollment.PlatformFeeRate;
            var (commissionAmount, netPayout) = PlatformFeeCalculator.SplitGross(gross, commissionRate);

            await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // Lock the tutor wallet so concurrent session releases cannot lose updates.
                var wallet = await _context.Wallets
                    .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {session.Enrollment.TutorProfileId} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);

                if (wallet == null || wallet.PendingBalance < gross)
                {
                    throw new InvalidOperationException("Financial invariant violated: Pending escrow balance is insufficient for session earning release.");
                }

                wallet.DebitPending(gross, now);
                wallet.CreditAvailable(netPayout, now);

                var payoutTx = Transaction.CreatePayout(
                    bookingId: session.Enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: null,
                    gross: gross,
                    feeRate: commissionRate,
                    feeAmount: commissionAmount,
                    netPayout: netPayout,
                    paymentGatewayRef: $"EscrowRelease-{session.Id:N}",
                    now: now);

                _context.Transactions.Add(payoutTx);

                var ledgerEntry = new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = WalletTransactionType.SessionPayoutCredit,
                    Amount = netPayout,
                    BalanceAfter = wallet.AvailableBalance,
                    Description = $"Payout released for Session #{session.SessionNumber}",
                    CreatedAt = now
                };

                if (_context.WalletTransactions != null)
                {
                    _context.WalletTransactions.Add(ledgerEntry);
                }

                _context.AddOutboxMessage(new SessionCompletedEvent(
                    session.Id,
                    session.EnrollmentId,
                    session.Enrollment.StudentProfile.UserId,
                    session.Enrollment.TutorProfile.UserId,
                    new MoneyDto(gross)));

                _context.AddOutboxMessage(new EarningCreatedEvent(
                    session.Id,
                    session.Enrollment.TutorProfileId,
                    session.Enrollment.TutorProfile.UserId,
                    new MoneyDto(gross),
                    new MoneyDto(commissionAmount),
                    new MoneyDto(netPayout),
                    payoutTx.Id));

                await _context.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            if (session.HasAttendanceConflict)
            {
                _context.AddOutboxMessage(new AttendanceConflictDetectedEvent(
                    session.Id,
                    session.EnrollmentId,
                    session.Enrollment.StudentProfile.UserId,
                    session.Enrollment.TutorProfile.UserId,
                    session.StudentAttendance?.ToString() ?? "None",
                    session.TutorAttendance?.ToString() ?? "None"));
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return SessionMapper.ToDto(session);
    }
}
