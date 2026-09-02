using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.SubmitAttendance;

public class SubmitAttendanceCommandHandler : IRequestHandler<SubmitAttendanceCommand, SessionDto>
{
    private readonly IAppDbContext _context;

    public SubmitAttendanceCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<SessionDto> Handle(SubmitAttendanceCommand request, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
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

        var now = DateTime.UtcNow;

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

        // 6. Resolution & Financial Earning Release
        // Invariant: Both sides must submit Attended to trigger Session.Complete() and escrow release
        if (session.StudentAttendance == AttendanceStatus.Attended &&
            session.TutorAttendance == AttendanceStatus.Attended)
        {
            session.Complete();
            session.Enrollment.RecordCompletedSession(session.Id);

            // Progressive Earning Calculation: Gross - 10% Platform Fee = Net
            var gross = session.EarningAmount;
            var commissionRate = 0.10m; // 10% baseline commission
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

            wallet.PendingBalance -= gross;
            wallet.AvailableBalance += netPayout;
            wallet.UpdatedAt = now;

            var payoutTx = new Transaction
            {
                Id = Guid.NewGuid(),
                BookingId = session.Enrollment.BookingId,
                SessionId = session.Id,
                Amount = gross,
                CommissionRate = commissionRate,
                CommissionAmount = commissionAmount,
                PayoutAmount = netPayout,
                PaymentGatewayRef = "EscrowRelease",
                Status = TransactionStatus.Released,
                CreatedAt = now,
                ReleasedAt = now
            };

            _context.Transactions.Add(payoutTx);
            session.Transaction = payoutTx;

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

            // Explicit DB Transaction
            if (_context.Database?.ProviderName != null)
            {
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
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            // Pending counterpart or Conflict flagged: Save attendance state without payout release
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new SessionDto(
            Id: session.Id,
            EnrollmentId: session.EnrollmentId,
            SessionNumber: session.SessionNumber,
            EarningAmount: session.EarningAmount,
            StartAt: session.StartAt,
            EndAt: session.EndAt,
            Status: session.Status,
            IsPayoutReleased: session.IsPayoutReleased,
            CreatedAt: session.CreatedAt,
            CompletedAt: session.CompletedAt,
            CancelledAt: session.CancelledAt,
            StudentAttendance: session.StudentAttendance,
            TutorAttendance: session.TutorAttendance,
            HasAttendanceConflict: session.HasAttendanceConflict
        );
    }
}
