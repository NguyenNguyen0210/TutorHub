using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.Common;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Reschedule.AcceptReschedule;

public class AcceptSessionRescheduleCommandHandler : IRequestHandler<AcceptSessionRescheduleCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public AcceptSessionRescheduleCommandHandler(
        IAppDbContext context,
        IAuditLogService auditLogService,
        IClock clock,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _auditLogService = auditLogService;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(AcceptSessionRescheduleCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var requestEntity = await _context.SessionRescheduleRequests
            .FirstOrDefaultAsync(r => r.Id == request.RequestId, cancellationToken);

        if (requestEntity == null)
        {
            throw new NotFoundException("SessionRescheduleRequest", request.RequestId);
        }

        if (requestEntity.SessionId != request.SessionId)
        {
            throw new NotFoundException("SessionRescheduleRequest does not belong to the specified session.");
        }

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.AvailabilitySlots)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Strict Actor Authorization (INV-RESCHED-001): Only the Student can accept
        if (session.Enrollment.StudentProfile.UserId != userId)
        {
            throw new ForbiddenException("Only the Student can accept a session reschedule proposal.");
        }

        // 2. Proposal State Check (INV-RESCHED-004)
        if (requestEntity.Status != RescheduleRequestStatus.Pending)
        {
            throw new ConflictException($"Reschedule request has already been resolved with status '{requestEntity.Status}'.");
        }

        // 3. Clock Sampling (P1 Deterministic Time)
        var now = _clock.UtcNow;

        // 4. Expiry Guard (Query-Time Semantics - Patch D)
        if (requestEntity.ProposedStartAt <= now)
        {
            throw new ConflictException("Cannot accept an expired reschedule proposal.");
        }

        // 5. Invariants on Session & Enrollment
        if (session.Enrollment.Status != EnrollmentStatus.Active)
        {
            throw new BadRequestException("Cannot reschedule sessions for an inactive or cancelled enrollment.");
        }

        if (session.Status != SessionStatus.Scheduled)
        {
            throw new ConflictException($"Cannot reschedule session in '{session.Status}' status. Session must be Scheduled.");
        }

        // 6. Canonical Attendance Lifecycle Guard (Patch K)
        if (session.AttendanceVerificationOpenedAt.HasValue)
        {
            throw new ConflictException("Cannot reschedule a session after attendance verification has begun.");
        }

        // 7. Authoritative Concurrency Boundary with Shared Row Lock (INV-RESCHED-010)
        var tutorProfileId = session.Enrollment.TutorProfileId;
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"TutorProfiles\" WHERE \"Id\" = {tutorProfileId} FOR UPDATE;",
            cancellationToken);

        try
        {
            // Re-validate availability slots against tutor's current profile
            SessionSchedulingValidationPolicy.ValidateTutorAvailability(
                requestEntity.ProposedStartAt,
                requestEntity.ProposedEndAt,
                session.Enrollment.TutorProfile.AvailabilitySlots);

            // Authoritative Overlap Re-check (INV-RESCHED-005)
            await SessionSchedulingValidationPolicy.CheckTutorSessionOverlapAsync(
                tutorProfileId,
                session.Id,
                requestEntity.ProposedStartAt,
                requestEntity.ProposedEndAt,
                _context,
                cancellationToken);

            // Capture previous timestamps BEFORE mutation
            var previousStartAt = session.StartAt ?? throw new InvalidOperationException("Session has no StartAt.");
            var previousEndAt = session.EndAt ?? throw new InvalidOperationException("Session has no EndAt.");

            // 8. Domain State Transitions
            session.Reschedule(requestEntity.ProposedStartAt, requestEntity.ProposedEndAt, now);
            requestEntity.Accept(userId, now);

            // 9. Transactional Outbox (DEC-S7-001, DEC-S7-002)
            _context.AddOutboxMessage(new SessionRescheduledEvent(
                session.Id,
                session.EnrollmentId,
                session.Enrollment.StudentProfile.UserId,
                session.Enrollment.TutorProfile.UserId,
                previousStartAt,
                previousEndAt,
                requestEntity.ProposedStartAt,
                requestEntity.ProposedEndAt,
                requestEntity.Id,
                userId,
                Guid.NewGuid(),
                1,
                now));

            // 10. Permanent Audit Log inside SAME transaction (INV-RESCHED-003)
            await _auditLogService.LogAsync(
                action: "SESSION_RESCHEDULED",
                entityName: "Session",
                entityId: session.Id.ToString(),
                userId: userId,
                oldValues: new { StartAt = previousStartAt, EndAt = previousEndAt },
                newValues: new { StartAt = requestEntity.ProposedStartAt, EndAt = requestEntity.ProposedEndAt, RescheduleRequestId = requestEntity.Id },
                cancellationToken: cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        // F-23 (Đợt 4): centralized mapping.
        return SessionMapper.ToDto(session);
    }
}
