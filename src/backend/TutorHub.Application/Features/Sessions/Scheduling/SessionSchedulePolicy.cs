using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Settings;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Sessions.Scheduling;

public sealed class SessionSchedulePolicy : ISessionSchedulePolicy
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

    public void RequireMinimumNotice(DateTime startAt, DateTime endAt, string operation = "cancelled") =>
        RequireSchedulable(startAt, endAt, operation);

    public void RequireSchedulable(DateTime startAt, DateTime endAt, string operation)
    {
        if (!SessionSchedulingRules.IsValidTimeRange(startAt, endAt))
        {
            throw new BadRequestException("End time must be after start time.");
        }

        if (!SessionSchedulingRules.HasSufficientNotice(startAt, _clock.UtcNow, TimeSpan.FromHours(_noticeHours)))
        {
            throw new BadRequestException($"Sessions must be {operation} at least {_noticeHours} hours in advance.");
        }
    }

    public void RequireNoOverlap(
        Guid tutorProfileId,
        DateTime startAt,
        DateTime endAt,
        IEnumerable<(Guid TutorProfileId, DateTime StartAt, DateTime? EndAt, string Status)> existing)
    {
        var relevantSlots = existing
            .Where(s => s.TutorProfileId == tutorProfileId && s.Status == nameof(SessionStatus.Scheduled))
            .Select(s => (s.StartAt, s.EndAt));

        if (SessionSchedulingRules.HasOverlap(startAt, endAt, relevantSlots))
        {
            throw new ConflictException("The new time overlaps another scheduled session.");
        }
    }
}
