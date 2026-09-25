using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.Common;
using TutorHub.Application.Features.Sessions.Scheduling;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.ScheduleSession;

public class ScheduleSessionCommandHandler : IRequestHandler<ScheduleSessionCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _configuration;
    private readonly IClock _clock;

    public ScheduleSessionCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IConfiguration configuration,
        IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _configuration = configuration;
        _clock = clock;
    }

    public async Task<SessionDto> Handle(ScheduleSessionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Tutor-only: student scheduling is gone.
        if (session.Enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("Only the tutor can schedule this session.");
        }

        // 2. Validate Enrollment state.
        if (session.Enrollment.Status != EnrollmentStatus.Active)
        {
            throw new BadRequestException("Cannot schedule sessions for an inactive or cancelled enrollment.");
        }

        // 3. Validate UTC DateTimeKind contract + exact duration match (unchanged).
        SessionSchedulingValidationPolicy.ValidateUtc(request.StartAt, request.EndAt);
        SessionSchedulingValidationPolicy.ValidateDuration(request.StartAt, request.EndAt, session.Enrollment.SessionDurationMinutes);

        // 4. Minimum-notice rule.
        var policy = new SessionSchedulePolicy(_configuration, _clock);
        policy.RequireSchedulable(request.StartAt, request.EndAt);

        var tutorProfileId = session.Enrollment.TutorProfileId;

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // 5. Overlap with the tutor's other Scheduled sessions in range.
            var overlapping = await _context.Sessions
                .Where(s => s.Id != session.Id &&
                            s.Enrollment.TutorProfileId == tutorProfileId &&
                            s.Status == SessionStatus.Scheduled &&
                            s.StartAt.HasValue &&
                            s.StartAt < request.EndAt && request.StartAt < s.EndAt)
                .Select(s => new
                {
                    TutorProfileId = s.Enrollment.TutorProfileId,
                    StartAt = s.StartAt,
                    EndAt = s.EndAt
                })
                .ToListAsync(cancellationToken);

            policy.RequireNoOverlap(
                tutorProfileId,
                request.StartAt,
                request.EndAt,
                overlapping
                    .Select(s => (s.TutorProfileId, s.StartAt!.Value, s.EndAt, nameof(SessionStatus.Scheduled))));

            // 6. Domain state transition (direct tutor schedule / reschedule, no ticket).
            var now = _clock.UtcNow;
            try
            {
                if (session.Status == SessionStatus.Unscheduled)
                {
                    session.Schedule(request.StartAt, request.EndAt);
                }
                else if (session.Status == SessionStatus.Scheduled)
                {
                    session.Reschedule(request.StartAt, request.EndAt, now);
                }
                else
                {
                    throw new ConflictException($"Cannot schedule session in '{session.Status}' status.");
                }
            }
            catch (InvalidOperationException ex)
            {
                throw new ConflictException(ex.Message);
            }

            // 7. Enqueue Outbox Message in same DB transaction (DEC-S7-001, DEC-S7-002).
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
