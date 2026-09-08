using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.SubmitAttendance;

public class SubmitAttendanceCommandHandler : IRequestHandler<SubmitAttendanceCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public SubmitAttendanceCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<SessionDto> Handle(SubmitAttendanceCommand request, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.Sessions)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Authorization: Only Student or Tutor of the Enrollment can submit attendance
        var isStudent = session.Enrollment.StudentProfile.UserId == request.UserId;
        var isTutor = session.Enrollment.TutorProfile.UserId == request.UserId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("You do not have permission to submit attendance for this session.");
        }

        // 2. Validate Enrollment state
        if (session.Enrollment.Status != EnrollmentStatus.Active)
        {
            throw new BadRequestException("Cannot submit attendance for an inactive or cancelled enrollment.");
        }

        // 3. Validate Session state
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

        // 4. Validate Time Window: Only allowed after session has ended
        if (session.EndAt.HasValue && session.EndAt.Value > now)
        {
            throw new BadRequestException("Attendance verification can only be submitted after the session has ended.");
        }

        // 5. Record Attendance submission
        if (isStudent)
        {
            session.SubmitStudentAttendance(request.Outcome, now);
        }
        else
        {
            session.SubmitTutorAttendance(request.Outcome, now);
        }

        // 5b. No-show discipline (Q1b): a self-recorded Absent is an admission
        // of absence and earns the submitter a strike. Silence is never judged.
        if (request.Outcome == AttendanceStatus.Absent)
        {
            var absentUser = isStudent
                ? session.Enrollment.StudentProfile.User
                : session.Enrollment.TutorProfile.User;
            absentUser?.RecordAbsentStrike(now);
        }

        // 6. Resolution & Financial Earning Release
        // Invariant: Both sides must submit Attended to trigger Session.Complete() and escrow release
        if (session.StudentAttendance == AttendanceStatus.Attended &&
            session.TutorAttendance == AttendanceStatus.Attended)
        {
            session.Complete();
            session.Enrollment.RecordCompletedSession(session.Id);

            // Progressive Earning Calculation: Gross - snapshot PlatformFeeRate = Net (DEC-S8-020)
            var gross = session.EarningAmount;
            var commissionRate = session.Enrollment.PlatformFeeRate > 0 ? session.Enrollment.PlatformFeeRate : 0.10m;
            var commissionAmount = Math.Round(gross * commissionRate, 0);
            var netPayout = gross - commissionAmount;

            // Financial integrity guard: No clamping, fail if pending balance insufficient
            var wallet = await _context.Wallets.FirstOrDefaultAsync(
                w => w.TutorProfileId == session.Enrollment.TutorProfileId,
                cancellationToken);

            if (wallet == null || wallet.PendingBalance < gross)
            {
                throw new InvalidOperationException("Financial invariant violated: Pending escrow balance is insufficient for session earning release.");
            }

            // F-23: guarded domain math (throws InvalidOperationException on violation).
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
                // F-10: gateway refs are unique per attempt (partial unique index).
                paymentGatewayRef: $"EscrowRelease-{session.Id:N}",
                now: now);

            _context.Transactions.Add(payoutTx);

            // Record WalletTransaction ledger entry (DEC-WD-004)
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

            // Enqueue SessionCompleted & EarningCreated Outbox Messages (DEC-S7-001, DEC-S7-002, DEC-S7-018)
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

            // Explicit DB Transaction
            await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
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
                // Enqueue AttendanceConflictDetected Outbox Message (DEC-S7-001, DEC-S7-002)
                _context.AddOutboxMessage(new AttendanceConflictDetectedEvent(
                    session.Id,
                    session.EnrollmentId,
                    session.Enrollment.StudentProfile.UserId,
                    session.Enrollment.TutorProfile.UserId,
                    session.StudentAttendance?.ToString() ?? "None",
                    session.TutorAttendance?.ToString() ?? "None"));
            }

            // Pending counterpart or Conflict flagged: Save attendance state without payout release
            await _context.SaveChangesAsync(cancellationToken);
        }

        // F-23 (Đợt 4): centralized mapping.
        return SessionMapper.ToDto(session);
    }
}
