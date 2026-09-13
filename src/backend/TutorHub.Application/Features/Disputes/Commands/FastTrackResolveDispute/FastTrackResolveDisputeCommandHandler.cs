using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.FastTrackResolveDispute;

public class FastTrackResolveDisputeCommandHandler : IRequestHandler<FastTrackResolveDisputeCommand, DisputeDto>
{
    private const int SilenceDaysRequired = 3;

    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public FastTrackResolveDisputeCommandHandler(IAppDbContext context, IClock clock, IAuditLogService auditLogService, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<DisputeDto> Handle(FastTrackResolveDisputeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Locked via separate SELECT ... FOR UPDATE (see AdminResolveDispute:
            // FromSql+Include breaks on the Disputes xmin row-version).
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

            if (dispute.Status == DisputeStatus.Resolved || dispute.Status == DisputeStatus.Dismissed)
            {
                throw new ConflictException($"Dispute is already closed in status '{dispute.Status}'.");
            }

            var session = dispute.Session;
            var enrollment = session.Enrollment;
            var now = _clock.UtcNow;

            // Fast track applies to pre-release escrow only; post-release needs full investigation.
            if (session.IsPayoutReleased)
            {
                throw new ConflictException("Fast-track resolution applies to pre-release escrow only. Use full resolution for post-release disputes.");
            }

            if (session.Status != SessionStatus.Scheduled)
            {
                throw new ConflictException($"Fast-track resolution requires a Scheduled session. Current status: '{session.Status}'.");
            }

            // Exactly one side Attended, the other silent, silence older than 3 days past due date.
            var studentAttended = session.StudentAttendance == AttendanceStatus.Attended;
            var tutorAttended = session.TutorAttendance == AttendanceStatus.Attended;
            var studentSilent = !session.StudentAttendance.HasValue;
            var tutorSilent = !session.TutorAttendance.HasValue;

            var silenceDeadline = session.AttendanceVerificationDueAt?.AddDays(SilenceDaysRequired);
            if (silenceDeadline == null || now < silenceDeadline)
            {
                throw new ConflictException($"Fast-track resolution requires more than {SilenceDaysRequired} days of silence past the verification due date.");
            }

            bool tutorClaims;
            if (tutorAttended && studentSilent)
            {
                tutorClaims = true;
            }
            else if (studentAttended && tutorSilent)
            {
                tutorClaims = false;
            }
            else
            {
                throw new ConflictException("Fast-track resolution requires exactly one Attended side and one silent side.");
            }

            if (dispute.Evidences == null || dispute.Evidences.Count == 0)
            {
                throw new ConflictException("Fast-track resolution requires at least one uploaded evidence.");
            }

            var tutorWallet = await _context.Wallets
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {enrollment.TutorProfileId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (tutorWallet == null)
            {
                throw new NotFoundException(nameof(Wallet), enrollment.TutorProfileId);
            }

            var gross = session.EarningAmount;
            // Snapshot rate is authoritative; a legitimate 0% must stay 0%.
            var feeRate = enrollment.PlatformFeeRate;

            // Pre-release escrow: remove the session's gross slice before splitting so
            // money is conserved (mirrors AdminResolveDispute Stage A, DEC-S8-025).
            tutorWallet.DebitPending(gross, now);

            DisputeResolutionDecision decision;
            if (tutorClaims)
            {
                // Tutor taught, student ghosted: release full net payout.
                decision = DisputeResolutionDecision.TutorWinsReleaseEarning;
                var platformFee = Math.Round(gross * feeRate, 2, MidpointRounding.AwayFromZero);
                var tutorNetPayout = gross - platformFee;

                tutorWallet.CreditAvailable(tutorNetPayout, now);

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = tutorWallet.Id,
                    DisputeId = dispute.Id,
                    Type = WalletTransactionType.SessionPayoutCredit,
                    Amount = tutorNetPayout,
                    BalanceAfter = tutorWallet.AvailableBalance,
                    Description = $"Fast-track payout for Session #{session.SessionNumber}",
                    CreatedAt = now
                });

                var payoutTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = enrollment.BookingId,
                    SessionId = session.Id,
                    DisputeId = dispute.Id,
                    Type = TransactionType.SessionPayoutCredit,
                    Amount = gross,
                    CommissionRate = feeRate,
                    CommissionAmount = platformFee,
                    PayoutAmount = tutorNetPayout,
                    PaymentGatewayRef = $"FastTrackEscrowRelease-{dispute.Id:N}",
                    Status = TransactionStatus.Released,
                    CreatedAt = now,
                    ReleasedAt = now
                };
                _context.Transactions.Add(payoutTx);
            }
            else
            {
                // Student attended, tutor ghosted: full refund.
                decision = DisputeResolutionDecision.StudentWinsFullRefund;
                var refundTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = enrollment.BookingId,
                    SessionId = session.Id,
                    DisputeId = dispute.Id,
                    Type = TransactionType.StudentRefund,
                    Amount = gross,
                    CommissionRate = 0,
                    CommissionAmount = 0,
                    PayoutAmount = 0,
                    PaymentGatewayRef = $"FastTrackEscrowRefund-{dispute.Id:N}",
                    Status = TransactionStatus.Pending,
                    CreatedAt = now
                };
                _context.Transactions.Add(refundTx);

                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(gross),
                    refundTx.Id));
            }

            session.ResolveAttendanceByAdmin(userId, request.AdminNotes, "DisputeFastTrack", now, releasePayout: tutorClaims);
            dispute.ResolveByAdmin(userId, decision, request.AdminNotes, now, affectsFinancial: true);
            dispute.ReleaseFinancialHold(userId, now);

            _context.AddOutboxMessage(new DisputeResolvedEvent(
                dispute.Id,
                enrollment.Id,
                enrollment.StudentProfile.UserId,
                enrollment.TutorProfile.UserId,
                decision.ToString()));

            await _auditLogService.LogAsync(
                action: "DisputeFastTrackResolved",
                entityName: "Dispute",
                entityId: dispute.Id.ToString(),
                userId: userId,
                oldValues: new { Status = "Open" },
                newValues: new { Status = dispute.Status.ToString(), Decision = decision.ToString(), request.AdminNotes },
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
