using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.Scheduling;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.ScheduleSessionsBatch;

public class ScheduleSessionsBatchHandler : IRequestHandler<ScheduleSessionsBatchCommand, List<SessionDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _configuration;
    private readonly IClock _clock;

    public ScheduleSessionsBatchHandler(
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

    public async Task<List<SessionDto>> Handle(ScheduleSessionsBatchCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var policy = new SessionSchedulePolicy(_configuration, _clock);

        // Pass 1: load ALL sessions in one query, validate every item before touching state.
        var ids = request.Items.Select(i => i.SessionId).ToList();
        var sessions = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.User)
            .Where(s => ids.Contains(s.Id))
            .ToListAsync(cancellationToken);
        var byId = sessions.ToDictionary(s => s.Id);

        foreach (var item in request.Items)
        {
            if (!byId.TryGetValue(item.SessionId, out var session))
            {
                throw new NotFoundException("Session", item.SessionId);
            }

            if (session.Status != SessionStatus.Unscheduled)
            {
                throw new ConflictException($"Cannot schedule session in '{session.Status}' status.");
            }

            if (session.Enrollment.Status != EnrollmentStatus.Active)
            {
                throw new BadRequestException("Cannot schedule sessions for an inactive or cancelled enrollment.");
            }

            if (session.Enrollment.TutorProfile.UserId != userId)
            {
                throw new ForbiddenException("Only the tutor can schedule this session.");
            }

            policy.RequireSchedulable(item.StartAt, item.EndAt);
        }

        // Overlap against the tutor's other Scheduled sessions (single query, batch ids excluded).
        var rangeStart = request.Items.Min(i => i.StartAt);
        var rangeEnd = request.Items.Max(i => i.EndAt);
        var dbScheduled = await _context.Sessions
            .Where(s => !ids.Contains(s.Id) &&
                        s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue &&
                        s.StartAt < rangeEnd && rangeStart < s.EndAt)
            .Select(s => new
            {
                TutorProfileId = s.Enrollment.TutorProfileId,
                StartAt = s.StartAt,
                EndAt = s.EndAt
            })
            .ToListAsync(cancellationToken);

        foreach (var item in request.Items)
        {
            var session = byId[item.SessionId];
            policy.RequireNoOverlap(
                session.Enrollment.TutorProfileId,
                item.StartAt,
                item.EndAt,
                dbScheduled
                    .Where(s => s.TutorProfileId == session.Enrollment.TutorProfileId)
                    .Select(s => (s.TutorProfileId, s.StartAt!.Value, s.EndAt, nameof(SessionStatus.Scheduled))));
        }

        // Intra-batch pairwise overlap (all items are tutor-owned by now).
        for (var i = 0; i < request.Items.Count; i++)
        {
            for (var j = i + 1; j < request.Items.Count; j++)
            {
                var a = request.Items[i];
                var b = request.Items[j];
                if (a.StartAt < b.EndAt && b.StartAt < a.EndAt)
                {
                    throw new ConflictException("Two sessions in the batch overlap each other.");
                }
            }
        }

        // Pass 2: apply everything, then persist once — no partial save.
        foreach (var item in request.Items)
        {
            var session = byId[item.SessionId];
            session.Schedule(item.StartAt, item.EndAt);
            _context.AddOutboxMessage(new SessionScheduledEvent(
                session.Id,
                session.EnrollmentId,
                session.Enrollment.StudentProfile.UserId,
                session.Enrollment.TutorProfile.UserId,
                item.StartAt,
                item.EndAt));
        }

        await _context.SaveChangesAsync(cancellationToken);

        return SessionMapper.ToOrderedList(request.Items.Select(i => byId[i.SessionId]));
    }
}
