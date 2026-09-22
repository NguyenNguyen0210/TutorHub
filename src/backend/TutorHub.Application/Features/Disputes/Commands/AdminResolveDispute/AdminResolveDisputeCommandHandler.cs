using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;

public class AdminResolveDisputeCommandHandler : IRequestHandler<AdminResolveDisputeCommand, DisputeDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public AdminResolveDisputeCommandHandler(IAppDbContext context, IClock clock, IAuditLogService auditLogService, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<DisputeDto> Handle(AdminResolveDisputeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
        // 1. Lock Dispute (Lock Order Level 1 - DEC-S8-027).
        // NOTE: locked via separate SELECT ... FOR UPDATE (not FromSql entity
        // query) because the Disputes xmin row-version breaks FromSql+Include
        // composition on Npgsql ("column t.xmin does not exist").
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"Disputes\" WHERE \"Id\" = {request.DisputeId} FOR UPDATE",
            cancellationToken);

        var dispute = await _context.Disputes
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .Include(d => d.InitiatorUser)
            .Include(d => d.RespondentUser)
            .Include(d => d.Evidences)
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken);

        if (dispute == null)
        {
            throw new NotFoundException(nameof(Dispute), request.DisputeId);
        }

        // Terminal state check (DEC-S8-002, INV-DISP-005)
        if (dispute.Status == DisputeStatus.Resolved || dispute.Status == DisputeStatus.Dismissed)
        {
            throw new ConflictException($"Dispute is already closed in status '{dispute.Status}'.");
        }

        // Anti-spam guard (Q3): financial resolutions require at least one uploaded evidence.
        // Dismissal without financial change is exempt.
        if (request.Decision != DisputeResolutionDecision.DismissedNoFinancialChange &&
            (dispute.Evidences == null || dispute.Evidences.Count == 0))
        {
            throw new ConflictException("Cannot resolve a dispute with financial consequences before at least one evidence is uploaded.");
        }

        var session = dispute.Session;
        var enrollment = session.Enrollment;
        var now = _clock.UtcNow;

        // 2. Lock Wallet (Lock Order Level 4 - DEC-S8-027)
        var tutorWallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {enrollment.TutorProfileId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (tutorWallet == null)
        {
            throw new NotFoundException(nameof(Wallet), enrollment.TutorProfileId);
        }

        // Handle Dismissal (no financial consequence)
        if (request.Decision == DisputeResolutionDecision.DismissedNoFinancialChange)
        {
            if (dispute.HoldType == FinancialHoldType.BalanceHold && dispute.HeldAmount > 0)
            {
                tutorWallet.ReleaseHold(dispute.HeldAmount, now);
                tutorWallet.UpdatedAt = now;

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = tutorWallet.Id,
                    DisputeId = dispute.Id,
                    Type = WalletTransactionType.DisputeHoldReleaseCredit,
                    Amount = dispute.HeldAmount,
                    BalanceAfter = tutorWallet.AvailableBalance,
                    Description = $"Dispute dismissed: hold released for Session #{session.SessionNumber}",
                    CreatedAt = now
                });
            }

            dispute.DismissByAdmin(userId, request.AdminNotes, now);
            dispute.ReleaseFinancialHold(userId, now);

            await _auditLogService.LogAsync(
                action: "DisputeResolved",
                entityName: "Dispute",
                entityId: dispute.Id.ToString(),
                userId: userId,
                oldValues: new { Status = "Open" },
                newValues: new { Status = dispute.Status.ToString(), Decision = request.Decision.ToString(), request.AdminNotes },
                cancellationToken: cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return MapToDto(dispute, session);
        }

        // Financial Resolution paths
        if (!session.IsPayoutReleased)
        {
            // =========================================================================
            // Stage A: Pre-Release (Pending Escrow) - DEC-S8-003, DEC-S8-025
            // =========================================================================
            var gross = session.EarningAmount;
            // Snapshot rate is authoritative; a legitimate 0% must stay 0%.
            var feeRate = enrollment.PlatformFeeRate;

            decimal studentRefund = 0m;
            decimal tutorGrossRelease = 0m;

            switch (request.Decision)
            {
                case DisputeResolutionDecision.StudentWinsFullRefund:
                    studentRefund = gross;
                    tutorGrossRelease = 0m;
                    break;

                case DisputeResolutionDecision.StudentWinsPartialRefund:
                    studentRefund = request.CustomRefundAmount ?? throw new BadRequestException("CustomRefundAmount is required.");
                    if (studentRefund <= 0 || studentRefund >= gross)
                        throw new BadRequestException($"Partial refund amount must be between 0 and {gross}.");
                    tutorGrossRelease = gross - studentRefund;
                    break;

                case DisputeResolutionDecision.TutorWinsReleaseEarning:
                    studentRefund = 0m;
                    tutorGrossRelease = gross;
                    break;
            }

            // DEC-S8-025 / money conservation: the pre-release earning still sits in the
            // tutor wallet's Pending escrow. Remove the session's gross slice before any
            // split; otherwise a tutor win creates money and a student win strands escrow.
            if (studentRefund > 0 || tutorGrossRelease > 0)
            {
                tutorWallet.DebitPending(gross, now);
            }

            var (platformFee, tutorNetPayout) = PlatformFeeCalculator.SplitGross(tutorGrossRelease, feeRate);

            // Update tutor wallet if tutor receives earning
            if (tutorNetPayout > 0)
            {
                // F-23: guarded domain math.
                tutorWallet.CreditAvailable(tutorNetPayout, now);

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = tutorWallet.Id,
                    DisputeId = dispute.Id,
                    Type = WalletTransactionType.SessionPayoutCredit,
                    Amount = tutorNetPayout,
                    BalanceAfter = tutorWallet.AvailableBalance,
                    Description = $"Dispute resolution payout for Session #{session.SessionNumber}",
                    CreatedAt = now
                });

                // Record SessionPayoutCredit
                var payoutTx = Transaction.CreatePayout(
                    bookingId: enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: dispute.Id,
                    gross: tutorGrossRelease,
                    feeRate: feeRate,
                    feeAmount: platformFee,
                    netPayout: tutorNetPayout,
                    paymentGatewayRef: $"DisputeEscrowRelease-{session.Id:N}",
                    now: now);
                _context.Transactions.Add(payoutTx);
            }

            // Record Student Refund if student receives refund (Status = Pending per DEC-S8-032)
            if (studentRefund > 0)
            {
                var refundTx = Transaction.CreateRefund(
                    bookingId: enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: dispute.Id,
                    originalPayout: null,
                    amount: studentRefund,
                    paymentGatewayRef: $"DisputeEscrowRefund-{dispute.Id:N}",
                    description: $"Pre-release escrow refund for Session #{session.SessionNumber}",
                    now: now);
                _context.Transactions.Add(refundTx);

                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(studentRefund),
                    refundTx.Id));
            }

            session.ResolveAttendanceByAdmin(userId, request.AdminNotes, "DisputeAdminResolution", now, releasePayout: tutorGrossRelease > 0);
            dispute.ResolveByAdmin(userId, request.Decision, request.AdminNotes, now, affectsFinancial: true);
            dispute.ReleaseFinancialHold(userId, now);
        }
        else
        {
            // =========================================================================
            // Stage B: Post-Release (Available Balance) - DEC-S8-025, INV-DISP-007
            // =========================================================================
            // 3. Lock Original Transaction (Lock Order Level 5 - DEC-S8-027)
            var originalTx = await _context.Transactions
                .FromSqlInterpolated($"SELECT * FROM \"Transactions\" WHERE \"SessionId\" = {session.Id} AND \"Type\" = 'SessionPayoutCredit' FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (originalTx == null)
            {
                throw new BadRequestException("Original session earning transaction was not found.");
            }

            // F-22 service-layer enforcement (mirrors the SaveChangesAsync anti-chain
            // guard): adjustments must point at the original earning, never at another
            // adjustment. Fail fast with 409 instead of surfacing InvalidOperation.
            if (originalTx.Type != TransactionType.SessionPayoutCredit)
            {
                throw new ConflictException("Original session earning transaction is not a payout record; chaining adjustments is forbidden.");
            }

            var originalGross = originalTx.Amount;
            var originalPlatformFee = originalTx.CommissionAmount;
            var originalTutorNet = originalTx.PayoutAmount;
            var appliedRate = originalTx.CommissionRate;

            if (request.Decision == DisputeResolutionDecision.TutorWinsReleaseEarning)
            {
                // Unhold funds completely
                if (dispute.HeldAmount > 0)
                {
                    tutorWallet.ReleaseHold(dispute.HeldAmount, now);
                    tutorWallet.UpdatedAt = now;

                    _context.WalletTransactions.Add(new WalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        WalletId = tutorWallet.Id,
                        DisputeId = dispute.Id,
                        Type = WalletTransactionType.DisputeHoldReleaseCredit,
                        Amount = dispute.HeldAmount,
                        BalanceAfter = tutorWallet.AvailableBalance,
                        Description = $"Tutor wins dispute: hold released for Session #{session.SessionNumber}",
                        CreatedAt = now
                    });
                }

                dispute.ResolveByAdmin(userId, request.Decision, request.AdminNotes, now, originalTransactionId: originalTx.Id, affectsFinancial: true);
                dispute.ReleaseFinancialHold(userId, now);
            }
            else
            {
                // StudentWinsFullRefund or StudentWinsPartialRefund
                decimal studentRefund = request.Decision == DisputeResolutionDecision.StudentWinsFullRefund
                    ? originalGross
                    : (request.CustomRefundAmount ?? throw new BadRequestException("CustomRefundAmount is required."));

                if (studentRefund <= 0 || studentRefund > originalGross)
                {
                    throw new BadRequestException($"Refund amount must be between 0 and {originalGross}.");
                }

                // Canonical Fee & Net Calculation (Mandatory Patch B, DEC-S8-025).
                // Extracted to the Domain so the conservation identity
                // StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal is unit-testable.
                var settlement = DisputeSettlementCalculator.CalculatePostRelease(
                    studentRefund: studentRefund,
                    originalGross: originalGross,
                    originalPlatformFee: originalPlatformFee,
                    originalTutorNet: originalTutorNet,
                    appliedRate: appliedRate);

                var tutorNetRecovery = settlement.TutorNetRecovery;
                var platformFeeReversal = settlement.PlatformFeeReversal;

                // Insufficient reserve guard (DEC-S8-026 / DEC-S8-028 / P1-5).
                // Must account for holds of OTHER active disputes so this recovery never
                // cannibalizes funds reserved for other disputes (preserves HeldBalance <= AvailableBalance).
                var availableExcludingOtherHolds = tutorWallet.AvailableBalance - Math.Max(0m, tutorWallet.HeldBalance - dispute.HeldAmount);
                if (availableExcludingOtherHolds < tutorNetRecovery)
                {
                    dispute.MarkRequiresAdminFinancialIntervention(
                        $"Tutor available balance excluding other active holds ({availableExcludingOtherHolds:N0} VND) is insufficient for required recovery ({tutorNetRecovery:N0} VND).");
                    await _auditLogService.LogAsync(
                        action: "DisputeRequiresFinancialIntervention",
                        entityName: "Dispute",
                        entityId: dispute.Id.ToString(),
                        userId: userId,
                        oldValues: new { Status = "UnderReview" },
                        newValues: new { Status = dispute.Status.ToString(), RequiredRecovery = tutorNetRecovery, AvailableBalance = tutorWallet.AvailableBalance },
                        cancellationToken: cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                    await tx.CommitAsync(cancellationToken);

                    return MapToDto(dispute, session);
                }

                // Deduct from tutor wallet
                if (dispute.HeldAmount > 0)
                {
                    tutorWallet.ReleaseHold(dispute.HeldAmount, now);
                }
                tutorWallet.DebitAvailable(tutorNetRecovery, now);

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = tutorWallet.Id,
                    DisputeId = dispute.Id,
                    Type = WalletTransactionType.DisputeRecoveryDebit,
                    Amount = tutorNetRecovery,
                    BalanceAfter = tutorWallet.AvailableBalance,
                    Description = $"Dispute recovery debit for Session #{session.SessionNumber}",
                    CreatedAt = now
                });

                // If held amount exceeded recovery (e.g. partial refund), record excess hold unheld
                if (dispute.HeldAmount > tutorNetRecovery)
                {
                    var excessHeld = dispute.HeldAmount - tutorNetRecovery;
                    _context.WalletTransactions.Add(new WalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        WalletId = tutorWallet.Id,
                        DisputeId = dispute.Id,
                        Type = WalletTransactionType.DisputeHoldReleaseCredit,
                        Amount = excessHeld,
                        BalanceAfter = tutorWallet.AvailableBalance,
                        Description = $"Excess dispute hold released for Session #{session.SessionNumber}",
                        CreatedAt = now
                    });
                }

                // Create explicit adjustments (Historical originalTx remains 100% immutable - DEC-S8-030).
                // F-23: factories re-validate the no-chaining rule (throws ArgumentException).
                var refundTx = Transaction.CreateRefund(
                    bookingId: enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: dispute.Id,
                    originalPayout: originalTx,
                    amount: studentRefund,
                    paymentGatewayRef: $"DisputePostReleaseRefund-{dispute.Id:N}",
                    description: $"Post-release dispute refund for Session #{session.SessionNumber}",
                    now: now);
                _context.Transactions.Add(refundTx);

                var feeReversalTx = Transaction.CreateFeeReversal(
                    bookingId: enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: dispute.Id,
                    originalPayout: originalTx,
                    feeRate: appliedRate,
                    feeReversalAmount: platformFeeReversal,
                    paymentGatewayRef: $"DisputeFeeReversal-{dispute.Id:N}",
                    now: now);
                _context.Transactions.Add(feeReversalTx);

                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(studentRefund),
                    refundTx.Id));

                dispute.ResolveByAdmin(userId, request.Decision, request.AdminNotes, now, originalTransactionId: originalTx.Id, affectsFinancial: true);
                dispute.ReleaseFinancialHold(userId, now);
            }
        }

        // Outbox event
        _context.AddOutboxMessage(new DisputeResolvedEvent(
            dispute.Id,
            enrollment.Id,
            enrollment.StudentProfile.UserId,
            enrollment.TutorProfile.UserId,
            request.Decision.ToString()));

        await _auditLogService.LogAsync(
            action: "DisputeResolved",
            entityName: "Dispute",
            entityId: dispute.Id.ToString(),
            userId: userId,
            oldValues: new { Status = "Open" },
            newValues: new { Status = dispute.Status.ToString(), Decision = request.Decision.ToString(), request.AdminNotes },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return MapToDto(dispute, session);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static DisputeDto MapToDto(Dispute dispute, Session session)
    {
        return new DisputeDto
        {
            Id = dispute.Id,
            SessionId = session.Id,
            SessionNumber = session.SessionNumber,
            EnrollmentId = session.EnrollmentId,
            InitiatorUserId = dispute.InitiatorUserId,
            InitiatorName = dispute.InitiatorUser?.FullName ?? "Unknown",
            RespondentUserId = dispute.RespondentUserId,
            RespondentName = dispute.RespondentUser?.FullName ?? "Unknown",
            Reason = dispute.Reason,
            Description = dispute.Description,
            Status = dispute.Status,
            ResolutionDecision = dispute.ResolutionDecision,
            AdminNotes = dispute.AdminNotes,
            ResolvedByAdminId = dispute.ResolvedByAdminId,
            ResolvedAt = dispute.ResolvedAt,
            HeldAmount = dispute.HeldAmount,
            HoldType = dispute.HoldType,
            HoldStatus = dispute.HoldStatus,
            HeldAt = dispute.HeldAt,
            CreatedAt = dispute.CreatedAt
        };
    }
}
