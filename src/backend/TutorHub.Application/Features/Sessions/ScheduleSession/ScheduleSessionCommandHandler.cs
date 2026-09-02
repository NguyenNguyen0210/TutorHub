using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.ScheduleSession;

public class ScheduleSessionCommandHandler : IRequestHandler<ScheduleSessionCommand, SessionDto>
{
    private readonly IAppDbContext _context;

    public ScheduleSessionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<SessionDto> Handle(ScheduleSessionCommand request, CancellationToken cancellationToken)
    {
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
        if (session.Enrollment.StudentProfile.UserId != request.UserId &&
            session.Enrollment.TutorProfile.UserId != request.UserId)
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
        if (request.StartAt.Kind != DateTimeKind.Utc || request.EndAt.Kind != DateTimeKind.Utc)
        {
            throw new BadRequestException("StartAt and EndAt must be in UTC format (ISO 8601 with Z).");
        }

        // 5. Invariant: Exact Duration Match (No rounding)
        var duration = request.EndAt - request.StartAt;
        if (duration != TimeSpan.FromMinutes(session.Enrollment.SessionDurationMinutes))
        {
            throw new BadRequestException($"Session duration must be exactly {session.Enrollment.SessionDurationMinutes} minutes according to the purchased service package.");
        }

        // 6. Timezone conversion to Canonical Timezone (Asia/Ho_Chi_Minh) & Availability check
        var canonicalTimeZone = TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
        var startLocal = TimeZoneInfo.ConvertTimeFromUtc(request.StartAt, canonicalTimeZone);
        var endLocal = TimeZoneInfo.ConvertTimeFromUtc(request.EndAt, canonicalTimeZone);

        if (startLocal.Date != endLocal.Date)
        {
            throw new BadRequestException("Sessions crossing midnight are not supported.");
        }

        var dayOfWeek = startLocal.DayOfWeek;
        var startLocalTime = TimeOnly.FromDateTime(startLocal);
        var endLocalTime = TimeOnly.FromDateTime(endLocal);

        var isWithinAvailability = session.Enrollment.TutorProfile.AvailabilitySlots.Any(s =>
            s.IsActive &&
            s.DayOfWeek == dayOfWeek &&
            startLocalTime >= s.StartTime &&
            endLocalTime <= s.EndTime);

        if (!isWithinAvailability)
        {
            throw new BadRequestException("The requested session time falls outside of the tutor's weekly availability schedule.");
        }

        // 7. Tutor-Scoped Concurrency & Overlap Protection
        var tutorProfileId = session.Enrollment.TutorProfileId;
        var hasSessionConflict = await _context.Sessions
            .AnyAsync(s => s.Id != session.Id &&
                           s.Enrollment.TutorProfileId == tutorProfileId &&
                           s.Status == SessionStatus.Scheduled &&
                           s.StartAt < request.EndAt && request.StartAt < s.EndAt,
                      cancellationToken);

        if (hasSessionConflict)
        {
            throw new ConflictException("The tutor already has another scheduled session during this time slot.");
        }

        var now = DateTime.UtcNow;
        var hasBookingConflict = await _context.Bookings
            .AnyAsync(b => b.TutorProfileId == tutorProfileId &&
                           b.StartAt < request.EndAt && request.StartAt < b.EndAt &&
                           (b.Status == BookingStatus.Confirmed ||
                            b.Status == BookingStatus.Pending ||
                            (b.Status == BookingStatus.Holding && b.HoldingExpiresAt.HasValue && b.HoldingExpiresAt.Value > now)),
                      cancellationToken);

        if (hasBookingConflict)
        {
            throw new ConflictException("The tutor already has another scheduled booking during this time slot.");
        }

        // 8. Domain state transition
        session.Schedule(request.StartAt, request.EndAt);
        await _context.SaveChangesAsync(cancellationToken);

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
            CancelledAt: session.CancelledAt
        );
    }
}
