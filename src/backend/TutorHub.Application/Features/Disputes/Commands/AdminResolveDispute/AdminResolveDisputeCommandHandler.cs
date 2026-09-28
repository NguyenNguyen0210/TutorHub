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
    private readonly IStudentWalletService _studentWalletService;

    public AdminResolveDisputeCommandHandler(
        IAppDbContext context,
        IClock clock,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService,
        IStudentWalletService studentWalletService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
        _studentWalletService = studentWalletService;
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

        // Handle Dismissal (no financial consequence).
        // 12h-grace rule: disputes are pre-release only, so there is never a
        // wallet BalanceHold to unwind here — just close the escrow record.
        if (request.Decision == DisputeResolutionDecision.DismissedNoFinancialChange)
        {
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

        // Financial Resolution paths.
        // 12h-grace rule: only pre-release (Pending escrow) resolution exists.
        // A released session is deemed accepted and can no longer be disputed.
        if (session.IsPayoutReleased)
        {
            throw new ConflictException("Payout for this session has already been released and can no longer be disputed.");
        }

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

        // Record Student Refund if student receives refund (Credited directly to Student Wallet)
        if (studentRefund > 0)
        {
            await _studentWalletService.CreditRefundAsync(
                enrollment.StudentProfileId,
                studentRefund,
                "DisputeResolution",
                dispute.Id,
                $"Hoàn tiền giải quyết tranh chấp Buổi #{session.SessionNumber}",
                now,
                cancellationToken);

            var refundTx = Transaction.CreateRefund(
                bookingId: enrollment.BookingId,
                sessionId: session.Id,
                disputeId: dispute.Id,
                originalPayout: null,
                amount: studentRefund,
                paymentGatewayRef: $"DisputeEscrowRefund-{dispute.Id:N}",
                description: $"Pre-release escrow refund for Session #{session.SessionNumber}",
                now: now);
            refundTx.Status = TransactionStatus.Succeeded;
            refundTx.RefundedAt = now;
            refundTx.SettlementRequired = false;
            _context.Transactions.Add(refundTx);

            _context.AddOutboxMessage(new RefundCreatedEvent(
                enrollment.Id,
                enrollment.StudentProfile.UserId,
                new MoneyDto(studentRefund),
                refundTx.Id,
                Guid.NewGuid(),
                1,
                now));

            _context.AddOutboxMessage(new RefundCompletedEvent(
                enrollment.Id,
                enrollment.StudentProfile.UserId,
                new MoneyDto(studentRefund),
                refundTx.Id,
                Guid.NewGuid(),
                1,
                now));
        }

        session.CompleteByAdmin(userId, request.AdminNotes, "DisputeAdminResolution", now, releasePayout: tutorGrossRelease > 0);
        dispute.ResolveByAdmin(userId, request.Decision, request.AdminNotes, now, affectsFinancial: true);
        dispute.ReleaseFinancialHold(userId, now);

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
