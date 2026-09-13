using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.Common;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.ScheduleSession;

public class ScheduleSessionCommandHandler : IRequestHandler<ScheduleSessionCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ScheduleSessionCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(ScheduleSessionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.AvailabilitySlots)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Authorization First: Only Student or Tutor participant can schedule
        if (session.Enrollment.StudentProfile.UserId != userId &&
            session.Enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to schedule this session.");
        }

        // 2. Validate Enrollment state
        if (session.Enrollment.Status != EnrollmentStatus.Active)
        {
            throw new BadRequestException("Cannot schedule sessions for an inactive or cancelled enrollment.");
        }

        // 3. Invariant: Initial Scheduling Only (Unscheduled -> Scheduled). No unilateral reschedule.
        if (session.Status != SessionStatus.Unscheduled)
        {
            throw new ConflictException($"Cannot schedule session in '{session.Status}' status. Agreed schedules cannot be unilaterally modified.");
        }

        // 4. Validate UTC DateTimeKind contract
        SessionSchedulingValidationPolicy.ValidateUtc(request.StartAt, request.EndAt);

        // 5. Invariant: Exact Duration Match (No rounding)
        SessionSchedulingValidationPolicy.ValidateDuration(request.StartAt, request.EndAt, session.Enrollment.SessionDurationMinutes);

        // 6. Timezone conversion to Canonical Timezone (Asia/Ho_Chi_Minh) & Availability check
        SessionSchedulingValidationPolicy.ValidateTutorAvailability(request.StartAt, request.EndAt, session.Enrollment.TutorProfile.AvailabilitySlots);

        // 7. Tutor-Scoped Concurrency & Overlap Protection (INV-AVAIL-008, INV-RESCHED-010)
        var tutorProfileId = session.Enrollment.TutorProfileId;

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"TutorProfiles\" WHERE \"Id\" = {tutorProfileId} FOR UPDATE;",
            cancellationToken);

        try
        {
            await SessionSchedulingValidationPolicy.CheckTutorSessionOverlapAsync(
                tutorProfileId,
                session.Id,
                request.StartAt,
                request.EndAt,
                _context,
                cancellationToken);

            // 8. Domain state transition
            session.Schedule(request.StartAt, request.EndAt);

            // Enqueue Outbox Message in same DB transaction (DEC-S7-001, DEC-S7-002)
            _context.AddOutboxMessage(new SessionScheduledEvent(
                session.Id,
                session.EnrollmentId,
                session.Enrollment.StudentProfile.UserId,
                session.Enrollment.TutorProfile.UserId,
                request.StartAt,
                request.EndAt));

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
