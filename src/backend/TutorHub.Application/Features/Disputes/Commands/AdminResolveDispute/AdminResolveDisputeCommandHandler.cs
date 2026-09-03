using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;

public class AdminResolveDisputeCommandHandler : IRequestHandler<AdminResolveDisputeCommand, DisputeDto>
{
    private readonly IAppDbContext _context;

    public AdminResolveDisputeCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DisputeDto> Handle(AdminResolveDisputeCommand request, CancellationToken cancellationToken)
    {
        var isNpgsql = _context.Database?.ProviderName != null &&
                       _context.Database.ProviderName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);

        // 1. Lock Dispute (Lock Order Level 1 - DEC-S8-027)
        Dispute? dispute;
        if (isNpgsql)
        {
            dispute = await _context.Disputes
                .FromSqlInterpolated($"SELECT * FROM \"Disputes\" WHERE \"Id\" = {request.DisputeId} FOR UPDATE")
                .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
                .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
                .Include(d => d.InitiatorUser)
                .Include(d => d.RespondentUser)
                .Include(d => d.Evidences)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            dispute = await _context.Disputes
                .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
                .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
                .Include(d => d.InitiatorUser)
                .Include(d => d.RespondentUser)
                .Include(d => d.Evidences)
                .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken);
        }

        if (dispute == null)
        {
            throw new NotFoundException(nameof(Dispute), request.DisputeId);
        }

        // Terminal state check (DEC-S8-002, INV-DISP-005)
        if (dispute.Status == DisputeStatus.Resolved || dispute.Status == DisputeStatus.Dismissed)
        {
            throw new ConflictException($"Dispute is already closed in status '{dispute.Status}'.");
        }

        var session = dispute.Session;
        var enrollment = session.Enrollment;
        var now = DateTime.UtcNow;

        // 2. Lock Wallet (Lock Order Level 4 - DEC-S8-027)
        Wallet? tutorWallet;
        if (isNpgsql)
        {
            tutorWallet = await _context.Wallets
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {enrollment.TutorProfileId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            tutorWallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.TutorProfileId == enrollment.TutorProfileId, cancellationToken);
        }

        if (tutorWallet == null)
        {
            throw new NotFoundException(nameof(Wallet), enrollment.TutorProfileId);
        }

        // Handle Dismissal (no financial consequence)
        if (request.Decision == DisputeResolutionDecision.DismissedNoFinancialChange)
        {
            if (dispute.HoldType == FinancialHoldType.BalanceHold && dispute.HeldAmount > 0)
            {
                tutorWallet.HeldBalance = Math.Max(0, tutorWallet.HeldBalance - dispute.HeldAmount);
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

            dispute.DismissByAdmin(request.AdminUserId, request.AdminNotes, now);
            dispute.ReleaseFinancialHold(request.AdminUserId, now);

            await _context.SaveChangesAsync(cancellationToken);
            return MapToDto(dispute, session);
        }

        // Financial Resolution paths
        if (!session.IsPayoutReleased)
        {
            // =========================================================================
            // Stage A: Pre-Release (Pending Escrow) - DEC-S8-003, DEC-S8-025
            // =========================================================================
            var gross = session.EarningAmount;
            var feeRate = 0.10m; // standard platform fee rate

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

            decimal platformFee = Math.Round(tutorGrossRelease * feeRate, MidpointRounding.AwayFromZero);
            decimal tutorNetPayout = tutorGrossRelease - platformFee;

            // Update tutor wallet if tutor receives earning
            if (tutorNetPayout > 0)
            {
                tutorWallet.AvailableBalance += tutorNetPayout;
                tutorWallet.UpdatedAt = now;

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
                var payoutTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = enrollment.BookingId,
                    SessionId = session.Id,
                    DisputeId = dispute.Id,
                    Type = TransactionType.SessionPayoutCredit,
                    Amount = tutorGrossRelease,
                    CommissionRate = feeRate,
                    CommissionAmount = platformFee,
                    PayoutAmount = tutorNetPayout,
                    PaymentGatewayRef = "DisputeEscrowRelease",
                    Status = TransactionStatus.Released,
                    CreatedAt = now,
                    ReleasedAt = now
                };
                _context.Transactions.Add(payoutTx);
                session.Transaction = payoutTx;
            }

            // Record Student Refund if student receives refund (Status = Pending per DEC-S8-032)
            if (studentRefund > 0)
            {
                var refundTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = enrollment.BookingId,
                    SessionId = session.Id,
                    DisputeId = dispute.Id,
                    Type = TransactionType.StudentRefund,
                    Amount = studentRefund,
                    CommissionRate = 0,
                    CommissionAmount = 0,
                    PayoutAmount = 0,
                    PaymentGatewayRef = "DisputeEscrowRefund",
                    Status = TransactionStatus.Pending,
                    CreatedAt = now
                };
                _context.Transactions.Add(refundTx);

                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(studentRefund),
                    refundTx.Id));
            }

            session.ResolveAttendanceByAdmin(request.AdminUserId, request.AdminNotes, "DisputeAdminResolution", now, releasePayout: tutorGrossRelease > 0);
            dispute.ResolveByAdmin(request.AdminUserId, request.Decision, request.AdminNotes, now, affectsFinancial: true);
            dispute.ReleaseFinancialHold(request.AdminUserId, now);
        }
        else
        {
            // =========================================================================
            // Stage B: Post-Release (Available Balance) - DEC-S8-025, INV-DISP-007
            // =========================================================================
            // 3. Lock Original Transaction (Lock Order Level 5 - DEC-S8-027)
            Transaction? originalTx;
            if (isNpgsql)
            {
                originalTx = await _context.Transactions
                    .FromSqlInterpolated($"SELECT * FROM \"Transactions\" WHERE \"SessionId\" = {session.Id} AND \"Type\" = 'SessionPayoutCredit' FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                originalTx = await _context.Transactions
                    .FirstOrDefaultAsync(t => t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit, cancellationToken);
            }

            if (originalTx == null)
            {
                throw new BadRequestException("Original session earning transaction was not found.");
            }

            var originalGross = originalTx.Amount;
            var originalPlatformFee = originalTx.CommissionAmount;
            var originalTutorNet = originalTx.PayoutAmount;
            var appliedRate = originalTx.CommissionRate > 0 ? originalTx.CommissionRate : 0.10m;

            if (request.Decision == DisputeResolutionDecision.TutorWinsReleaseEarning)
            {
                // Unhold funds completely
                if (dispute.HeldAmount > 0)
                {
                    tutorWallet.HeldBalance = Math.Max(0, tutorWallet.HeldBalance - dispute.HeldAmount);
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

                dispute.ResolveByAdmin(request.AdminUserId, request.Decision, request.AdminNotes, now, originalTransactionId: originalTx.Id, affectsFinancial: true);
                dispute.ReleaseFinancialHold(request.AdminUserId, now);
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

                // Canonical Fee & Net Calculation (Mandatory Patch B, DEC-S8-025)
                var tutorFinalGross = originalGross - studentRefund;
                var platformFinalFee = Math.Round(tutorFinalGross * appliedRate, MidpointRounding.AwayFromZero);
                var tutorFinalNet = tutorFinalGross - platformFinalFee;

                var tutorNetRecovery = originalTutorNet - tutorFinalNet;
                var platformFeeReversal = originalPlatformFee - platformFinalFee;

                // Insufficient reserve guard (DEC-S8-026)
                if (tutorWallet.AvailableBalance < tutorNetRecovery)
                {
                    dispute.MarkRequiresAdminFinancialIntervention(
                        $"Tutor available balance ({tutorWallet.AvailableBalance:N0} VND) is insufficient for required recovery ({tutorNetRecovery:N0} VND).");
                    await _context.SaveChangesAsync(cancellationToken);
                    return MapToDto(dispute, session);
                }

                // Deduct from tutor wallet
                if (dispute.HeldAmount > 0)
                {
                    tutorWallet.HeldBalance = Math.Max(0, tutorWallet.HeldBalance - dispute.HeldAmount);
                }
                tutorWallet.AvailableBalance -= tutorNetRecovery;
                tutorWallet.UpdatedAt = now;

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

                // Create explicit adjustments (Historical originalTx remains 100% immutable - DEC-S8-030)
                var refundTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = enrollment.BookingId,
                    SessionId = session.Id,
                    DisputeId = dispute.Id,
                    RelatedTransactionId = originalTx.Id,
                    Type = TransactionType.StudentRefund,
                    Amount = studentRefund,
                    CommissionRate = 0,
                    CommissionAmount = 0,
                    PayoutAmount = 0,
                    PaymentGatewayRef = "DisputePostReleaseRefund",
                    Status = TransactionStatus.Pending, // DEC-S8-032
                    CreatedAt = now
                };
                _context.Transactions.Add(refundTx);

                var feeReversalTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = enrollment.BookingId,
                    SessionId = session.Id,
                    DisputeId = dispute.Id,
                    RelatedTransactionId = originalTx.Id,
                    Type = TransactionType.PlatformFeeReversal,
                    Amount = 0,
                    CommissionRate = appliedRate,
                    CommissionAmount = platformFeeReversal,
                    PayoutAmount = 0,
                    PaymentGatewayRef = "DisputeFeeReversal",
                    Status = TransactionStatus.Succeeded, // DEC-S8-035: internal accounting committed
                    CreatedAt = now
                };
                _context.Transactions.Add(feeReversalTx);

                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(studentRefund),
                    refundTx.Id));

                dispute.ResolveByAdmin(request.AdminUserId, request.Decision, request.AdminNotes, now, originalTransactionId: originalTx.Id, affectsFinancial: true);
                dispute.ReleaseFinancialHold(request.AdminUserId, now);
            }
        }

        // Outbox event
        _context.AddOutboxMessage(new DisputeResolvedEvent(
            dispute.Id,
            enrollment.Id,
            enrollment.StudentProfile.UserId,
            enrollment.TutorProfile.UserId,
            request.Decision.ToString()));

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(dispute, session);
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
