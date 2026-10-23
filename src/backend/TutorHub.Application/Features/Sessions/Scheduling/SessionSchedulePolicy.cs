using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Settings;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Scheduling;

public sealed class SessionSchedulePolicy
{
    private const int DefaultMinimumNoticeHours = 2;

    private readonly int _noticeHours;
    private readonly IClock _clock;

    public SessionSchedulePolicy(IOptions<SchedulingOptions>? options, IClock clock)
    {
        var h = options?.Value?.MinimumNoticeHours;
        _noticeHours = h.HasValue && h.Value >= 0 ? h.Value : DefaultMinimumNoticeHours;
        _clock = clock;
    }

    public SessionSchedulePolicy(int noticeHours, IClock clock)
    {
        _noticeHours = noticeHours >= 0 ? noticeHours : DefaultMinimumNoticeHours;
        _clock = clock;
    }

    public void RequireSchedulable(DateTime startAt, DateTime endAt) => RequireSchedulable(startAt, endAt, "scheduled");

    /// <summary>
    /// Cancellation uses the same minimum-notice window as scheduling so a
    /// session cannot be cancelled immediately before it starts.
    /// </summary>
    public void RequireMinimumNotice(DateTime startAt, DateTime endAt, string operation = "cancelled") =>
        RequireSchedulable(startAt, endAt, operation);

    public void RequireSchedulable(DateTime startAt, DateTime endAt, string operation)
    {
        if (endAt <= startAt) throw new BadRequestException("End time must be after start time.");
        if (startAt < _clock.UtcNow.AddHours(_noticeHours))
            throw new BadRequestException($"Sessions must be {operation} at least {_noticeHours} hours in advance.");
    }

    public void RequireNoOverlap(Guid tutorProfileId, DateTime startAt, DateTime endAt,
        IEnumerable<(Guid TutorProfileId, DateTime StartAt, DateTime? EndAt, string Status)> existing)
    {
        var clash = existing.Any(s => s.TutorProfileId == tutorProfileId
            && s.Status == nameof(SessionStatus.Scheduled)
            && startAt < (s.EndAt ?? DateTime.MaxValue)
            && s.StartAt < endAt);
        if (clash) throw new ConflictException("The new time overlaps another scheduled session.");
    }
}
