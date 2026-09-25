using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Scheduling;

public sealed class SessionSchedulePolicy
{
    private readonly int _noticeHours;
    private readonly IClock _clock;

    public SessionSchedulePolicy(IConfiguration configuration, IClock clock)
    {
        _noticeHours = configuration.GetValue<int?>("Scheduling:MinimumNoticeHours") is int h && h >= 0 ? h : 24;
        _clock = clock;
    }

    public void RequireSchedulable(DateTime startAt, DateTime endAt)
    {
        if (endAt <= startAt) throw new BadRequestException("End time must be after start time.");
        if (startAt < _clock.UtcNow.AddHours(_noticeHours))
            throw new BadRequestException($"Sessions must be scheduled at least {_noticeHours} hours in advance.");
    }

    public void RequireNoOverlap(Guid tutorProfileId, DateTime startAt, DateTime endAt,
        IEnumerable<(Guid TutorProfileId, DateTime StartAt, DateTime? EndAt, string Status)> existing)
    {
        var clash = existing.Any(s => s.TutorProfileId == tutorProfileId
            && s.Status == nameof(SessionStatus.Scheduled)
            && startAt < (s.EndAt ?? DateTime.MaxValue) && (s.EndAt ?? startAt.AddMinutes(1)) > startAt
            && s.StartAt < endAt);
        if (clash) throw new ConflictException("The new time overlaps another scheduled session.");
    }
}
