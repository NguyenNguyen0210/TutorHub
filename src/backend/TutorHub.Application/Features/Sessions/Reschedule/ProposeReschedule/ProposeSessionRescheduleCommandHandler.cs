using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Common;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Reschedule.ProposeReschedule;

public class ProposeSessionRescheduleCommandHandler : IRequestHandler<ProposeSessionRescheduleCommand, SessionRescheduleRequestDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public ProposeSessionRescheduleCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<SessionRescheduleRequestDto> Handle(ProposeSessionRescheduleCommand request, CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.AvailabilitySlots)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Strict Actor Authorization (INV-RESCHED-001 / Patch A): Only Tutor can propose
        if (session.Enrollment.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("Only the Tutor can propose a session reschedule.");
        }

        // 2. Validate Enrollment Status
        if (session.Enrollment.Status != EnrollmentStatus.Active)
        {
            throw new BadRequestException("Cannot propose reschedule for an inactive or cancelled enrollment.");
        }

        // 3. Validate Session State
        if (session.Status != SessionStatus.Scheduled)
        {
            throw new ConflictException($"Cannot reschedule session in '{session.Status}' status. Session must be Scheduled.");
        }

        if (!session.StartAt.HasValue || session.StartAt.Value <= now)
        {
            throw new ConflictException("Cannot reschedule a session that has already started or taken place.");
        }

        // 4. Canonical Attendance Lifecycle Check (Patch K)
        if (session.AttendanceVerificationOpenedAt.HasValue)
        {
            throw new ConflictException("Cannot reschedule a session after attendance verification has begun.");
        }

        // 5. Future Proposed Time Check
        if (request.ProposedStartAt <= now)
        {
            throw new BadRequestException("Proposed start time must be in the future.");
        }

        // 6. Scheduling Policy Validations (INV-RESCHED-005)
        SessionSchedulingValidationPolicy.ValidateUtc(request.ProposedStartAt, request.ProposedEndAt);
        SessionSchedulingValidationPolicy.ValidateDuration(request.ProposedStartAt, request.ProposedEndAt, session.Enrollment.SessionDurationMinutes);
        SessionSchedulingValidationPolicy.ValidateTutorAvailability(request.ProposedStartAt, request.ProposedEndAt, session.Enrollment.TutorProfile.AvailabilitySlots);

        // 7. Preliminary Advisory Overlap Check
        await SessionSchedulingValidationPolicy.CheckTutorSessionOverlapAsync(
            session.Enrollment.TutorProfileId,
            session.Id,
            request.ProposedStartAt,
            request.ProposedEndAt,
            _context,
            cancellationToken);

        // 8. Single Active Pending Proposal Check (INV-RESCHED-004)
        var hasPending = await _context.SessionRescheduleRequests
            .AnyAsync(r => r.SessionId == session.Id && r.Status == RescheduleRequestStatus.Pending, cancellationToken);

        if (hasPending)
        {
            throw new ConflictException("A pending reschedule request already exists for this session.");
        }

        // 9. Create Proposal (Zero schedule mutation on Session)
        var rescheduleRequest = SessionRescheduleRequest.Create(
            session.Id,
            session.Enrollment.TutorProfile.UserId,
            session.Enrollment.StudentProfile.UserId,
            request.ProposedStartAt,
            request.ProposedEndAt,
            request.Reason,
            now);

        _context.SessionRescheduleRequests.Add(rescheduleRequest);

        // 10. Persist with specific PostgreSQL unique constraint collision handling (Patch J)
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            throw new ConflictException("A pending reschedule request already exists for this session.");
        }

        return SessionRescheduleRequestDto.FromEntity(rescheduleRequest);
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException;
        if (inner == null)
        {
            return false;
        }

        var msg = inner.Message;
        var constraintName = inner.GetType().GetProperty("ConstraintName")?.GetValue(inner) as string;
        var sqlState = inner.GetType().GetProperty("SqlState")?.GetValue(inner) as string;

        var isUniqueViolationCode = sqlState == "23505" || msg.Contains("23505", StringComparison.OrdinalIgnoreCase);
        var isTargetConstraint = string.Equals(constraintName, "IX_SessionRescheduleRequests_SessionId", StringComparison.OrdinalIgnoreCase) ||
                                 msg.Contains("IX_SessionRescheduleRequests_SessionId", StringComparison.OrdinalIgnoreCase);

        return isUniqueViolationCode && isTargetConstraint;
    }
}
