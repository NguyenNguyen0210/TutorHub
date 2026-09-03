using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.CreateDispute;

public class CreateDisputeCommandHandler : IRequestHandler<CreateDisputeCommand, DisputeDto>
{
    private readonly IAppDbContext _context;

    public CreateDisputeCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DisputeDto> Handle(CreateDisputeCommand request, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException(nameof(Session), request.SessionId);
        }

        // Authorization: Initiator must be Student or Tutor of this session
        var studentUserId = session.Enrollment.StudentProfile.UserId;
        var tutorUserId = session.Enrollment.TutorProfile.UserId;

        if (request.InitiatorUserId != studentUserId && request.InitiatorUserId != tutorUserId)
        {
            throw new ForbiddenException("You are not a participant in this session.");
        }

        var respondentUserId = request.InitiatorUserId == studentUserId ? tutorUserId : studentUserId;

        // Session status check: can only dispute Scheduled or Completed sessions
        if (session.Status == SessionStatus.Unscheduled || session.Status == SessionStatus.Cancelled)
        {
            throw new BadRequestException($"Cannot dispute a session in '{session.Status}' status.");
        }

        // Active dispute deduplication: only 1 active dispute per session (INV-DISP-001)
        var existingActiveDispute = await _context.Disputes
            .AnyAsync(d => d.SessionId == session.Id &&
                           d.Status != DisputeStatus.Resolved &&
                           d.Status != DisputeStatus.Dismissed, cancellationToken);

        if (existingActiveDispute)
        {
            throw new ConflictException("An active dispute already exists for this session.");
        }

        var now = DateTime.UtcNow;
        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            InitiatorUserId = request.InitiatorUserId,
            RespondentUserId = respondentUserId,
            Reason = request.Reason,
            Description = request.Description,
            CreatedAt = now
        };

        // Determine Financial Stage & Hold Allocation (DEC-S8-022, DEC-S8-025, DEC-S8-028)
        if (!session.IsPayoutReleased)
        {
            // Stage A: Pre-Release (Pending Escrow)
            // Money is in pending escrow; lock attendance release.
            // HeldBalance on wallet is NOT incremented (INV-DISP-006).
            dispute.SetFinancialHold(session.EarningAmount, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, now);
            session.FlagAttendanceConflict();
        }
        else
        {
            // Stage B: Post-Release (Available Balance)
            // Earning has already been credited to tutor's AvailableBalance.
            var originalTx = await _context.Transactions
                .FirstOrDefaultAsync(t => t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit, cancellationToken);

            var maxTutorRecovery = originalTx?.PayoutAmount ?? session.EarningAmount;

            // Concurrency-safe atomic wallet lock before reading balances (DEC-S8-028, INV-CONCURRENCY-003)
            Wallet? tutorWallet;
            if (_context.Database?.ProviderName != null &&
                _context.Database.ProviderName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
            {
                tutorWallet = await _context.Wallets
                    .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {session.Enrollment.TutorProfileId} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                tutorWallet = await _context.Wallets
                    .FirstOrDefaultAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId, cancellationToken);
            }

            if (tutorWallet != null)
            {
                var withdrawableBalance = tutorWallet.AvailableBalance - tutorWallet.HeldBalance;

                if (withdrawableBalance >= maxTutorRecovery)
                {
                    // Full BalanceHold allocated atomically
                    tutorWallet.HeldBalance += maxTutorRecovery;
                    tutorWallet.UpdatedAt = now;
                    dispute.SetFinancialHold(maxTutorRecovery, FinancialHoldType.BalanceHold, FinancialHoldStatus.Active, now);

                    // Record ledger transaction entry
                    var holdTx = new WalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        WalletId = tutorWallet.Id,
                        DisputeId = dispute.Id,
                        Type = WalletTransactionType.DisputeHoldReservationDebit,
                        Amount = maxTutorRecovery,
                        BalanceAfter = tutorWallet.AvailableBalance,
                        Description = $"Funds held for Dispute on Session #{session.SessionNumber}",
                        CreatedAt = now
                    };
                    _context.WalletTransactions.Add(holdTx);
                }
                else
                {
                    // Zero partial hold allocated; preserves 0 <= HeldBalance <= AvailableBalance (DEC-S8-028)
                    dispute.SetFinancialHold(0m, FinancialHoldType.BalanceHold, FinancialHoldStatus.InsufficientFunds, now);
                    dispute.MarkRequiresAdminFinancialIntervention(
                        $"Tutor withdrawable balance ({withdrawableBalance:N0} VND) is insufficient for required hold ({maxTutorRecovery:N0} VND).");
                }
            }
        }

        _context.Disputes.Add(dispute);

        // Outbox event (DEC-S7-001)
        _context.AddOutboxMessage(new DisputeCreatedEvent(
            dispute.Id,
            session.EnrollmentId,
            request.InitiatorUserId,
            respondentUserId));

        await _context.SaveChangesAsync(cancellationToken);

        var initiatorName = request.InitiatorUserId == studentUserId
            ? session.Enrollment.StudentProfile.User?.FullName ?? "Student"
            : session.Enrollment.TutorProfile.User?.FullName ?? "Tutor";

        var respondentName = respondentUserId == studentUserId
            ? session.Enrollment.StudentProfile.User?.FullName ?? "Student"
            : session.Enrollment.TutorProfile.User?.FullName ?? "Tutor";

        return new DisputeDto
        {
            Id = dispute.Id,
            SessionId = session.Id,
            SessionNumber = session.SessionNumber,
            EnrollmentId = session.EnrollmentId,
            InitiatorUserId = dispute.InitiatorUserId,
            InitiatorName = initiatorName,
            RespondentUserId = dispute.RespondentUserId,
            RespondentName = respondentName,
            Reason = dispute.Reason,
            Description = dispute.Description,
            Status = dispute.Status,
            HeldAmount = dispute.HeldAmount,
            HoldType = dispute.HoldType,
            HoldStatus = dispute.HoldStatus,
            HeldAt = dispute.HeldAt,
            CreatedAt = dispute.CreatedAt,
            AdminNotes = dispute.AdminNotes
        };
    }
}
