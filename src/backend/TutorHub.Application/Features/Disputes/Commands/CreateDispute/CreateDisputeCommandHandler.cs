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
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CreateDisputeCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<DisputeDto> Handle(CreateDisputeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
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

        if (userId != studentUserId && userId != tutorUserId)
        {
            throw new ForbiddenException("You are not a participant in this session.");
        }

        var respondentUserId = userId == studentUserId ? tutorUserId : studentUserId;

        // 12h-grace rule (owner decision v1.4): disputes exist ONLY pre-release.
        // A session past its 12-hour grace window without a report is deemed
        // accepted and its payout auto-releases; post-payout sessions ("Completed"
        // or already released) can no longer be disputed ("khỏi kiện").
        if (session.Status != SessionStatus.AwaitingPayout)
        {
            throw new BadRequestException(
                $"Cannot dispute a session in '{session.Status}' status. Disputes are only accepted during the 12-hour grace period before payout; a released session is deemed accepted.");
        }

        if (session.IsPayoutReleased)
        {
            throw new ConflictException("Payout for this session has already been released and can no longer be disputed.");
        }

        // A dispute addresses an issue with a delivery inside its grace window
        // (FR-DISPUTE-001, PRD §8.4). AwaitingPayout implies the session already
        // took place; future sessions use cancellation or reschedule instead.
        var now = _clock.UtcNow;

        // Grace window still open: expiry without a report means acceptance.
        if (session.GracePeriodEndsAt.HasValue && session.GracePeriodEndsAt.Value < now)
        {
            throw new BadRequestException("The 12-hour grace period has expired. The session is deemed accepted and can no longer be disputed.");
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

        // P1-4: Prevent double-disputing / double-refunding if a dispute was already resolved with financial consequences
        var alreadyResolvedDispute = await _context.Disputes
            .AnyAsync(d => d.SessionId == session.Id &&
                           (d.Status == DisputeStatus.Resolved || d.Status == DisputeStatus.RequiresAdminRefundSettlement) &&
                           d.AffectsFinancialResolution, cancellationToken);

        if (alreadyResolvedDispute)
        {
            throw new ConflictException("This session has already been resolved with financial settlement and cannot be disputed again.");
        }

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            InitiatorUserId = userId,
            RespondentUserId = respondentUserId,
            Reason = request.Reason,
            Description = request.Description,
            CreatedAt = now
        };

        // Pre-release only (12h-grace rule): money is still in Pending escrow,
        // so creating the dispute locks payout release without touching the
        // tutor's Available balance. HeldBalance on wallet is NOT incremented.
        dispute.SetFinancialHold(session.EarningAmount, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, now);

        _context.Disputes.Add(dispute);

        // Outbox event (DEC-S7-001)
        _context.AddOutboxMessage(new DisputeCreatedEvent(
            dispute.Id,
            session.EnrollmentId,
            userId,
            respondentUserId));

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var initiatorName = userId == studentUserId
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
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
