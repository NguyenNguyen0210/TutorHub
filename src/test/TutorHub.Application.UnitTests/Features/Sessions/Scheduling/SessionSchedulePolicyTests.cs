using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Scheduling;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Sessions.Scheduling;

public class SessionSchedulePolicyTests
{
    [Fact]
    public void RequireNotice_RejectsStartInsideNoticeWindow()
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));
        var ex = Assert.Throws<BadRequestException>(() =>
            policy.RequireSchedulable(Utc(2026, 9, 27, 9, 0), Utc(2026, 9, 27, 10, 0)));
        Assert.Contains(ex.Errors, e => e.Contains("24"));
    }

    [Fact]
    public void RequireSchedulable_AcceptsStartBeyondNoticeWindow()
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));

        // Exactly on the boundary (start == now + 24h) is allowed; beyond is allowed.
        policy.RequireSchedulable(Utc(2026, 9, 27, 10, 0), Utc(2026, 9, 27, 11, 0));
        policy.RequireSchedulable(Utc(2026, 9, 27, 11, 0), Utc(2026, 9, 27, 12, 0));
    }

    [Theory]
    [InlineData(2026, 9, 27, 10, 0, 2026, 9, 27, 10, 0)] // end == start
    [InlineData(2026, 9, 27, 11, 0, 2026, 9, 27, 10, 0)] // end < start
    public void RequireSchedulable_RejectsEndAtOrBeforeStart(
        int sY, int sM, int sD, int sH, int sMin,
        int eY, int eM, int eD, int eH, int eMin)
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(0), FixedClock(Utc(2026, 9, 26, 10, 0)));

        Assert.Throws<BadRequestException>(() =>
            policy.RequireSchedulable(Utc(sY, sM, sD, sH, sMin), Utc(eY, eM, eD, eH, eMin)));
    }

    [Theory]
    [InlineData(null)] // key missing
    [InlineData("-5")] // negative
    public void RequireSchedulable_FallsBackToDefault24h_WhenConfigMissingOrNegative(string? rawValue)
    {
        var policy = new SessionSchedulePolicy(ConfigWithRawValue(rawValue), FixedClock(Utc(2026, 9, 26, 10, 0)));

        var ex = Assert.Throws<BadRequestException>(() =>
            policy.RequireSchedulable(Utc(2026, 9, 27, 9, 0), Utc(2026, 9, 27, 10, 0)));
        Assert.Contains(ex.Errors, e => e.Contains("24"));
    }

    [Fact]
    public void RequireNoOverlap_DetectsClashWithSameTutorScheduledSession()
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));
        var tutorId = Guid.NewGuid();
        var existing = new[]
        {
            (tutorId, Utc(2026, 9, 28, 10, 0), (DateTime?)Utc(2026, 9, 28, 11, 0), nameof(SessionStatus.Scheduled)),
        };

        Assert.Throws<ConflictException>(() =>
            policy.RequireNoOverlap(tutorId, Utc(2026, 9, 28, 10, 30), Utc(2026, 9, 28, 11, 30), existing));
    }

    [Fact]
    public void RequireNoOverlap_PassesWhenTimesDoNotOverlap()
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));
        var tutorId = Guid.NewGuid();
        var existing = new[]
        {
            (tutorId, Utc(2026, 9, 28, 10, 0), (DateTime?)Utc(2026, 9, 28, 11, 0), nameof(SessionStatus.Scheduled)),
        };

        // Adjacent (existing ends exactly when the new one starts) is not an overlap.
        policy.RequireNoOverlap(tutorId, Utc(2026, 9, 28, 11, 0), Utc(2026, 9, 28, 12, 0), existing);
        policy.RequireNoOverlap(tutorId, Utc(2026, 9, 28, 12, 0), Utc(2026, 9, 28, 13, 0), Array.Empty<(Guid, DateTime, DateTime?, string)>());
    }

    [Fact]
    public void RequireNoOverlap_IgnoresSessionsOfOtherTutors()
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));
        var existing = new[]
        {
            (Guid.NewGuid(), Utc(2026, 9, 28, 10, 0), (DateTime?)Utc(2026, 9, 28, 11, 0), nameof(SessionStatus.Scheduled)),
        };

        policy.RequireNoOverlap(Guid.NewGuid(), Utc(2026, 9, 28, 10, 30), Utc(2026, 9, 28, 11, 30), existing);
    }

    [Theory]
    [InlineData(nameof(SessionStatus.Unscheduled))]
    [InlineData(nameof(SessionStatus.Completed))]
    [InlineData(nameof(SessionStatus.Cancelled))]
    public void RequireNoOverlap_IgnoresNonScheduledSessions(string status)
    {
        var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));
        var tutorId = Guid.NewGuid();
        var existing = new[]
        {
            (tutorId, Utc(2026, 9, 28, 10, 0), (DateTime?)Utc(2026, 9, 28, 11, 0), status),
        };

        policy.RequireNoOverlap(tutorId, Utc(2026, 9, 28, 10, 30), Utc(2026, 9, 28, 11, 30), existing);
    }

    private static IConfiguration ConfigWithNoticeHours(int hours) =>
        ConfigWithRawValue(hours.ToString());

    private static IConfiguration ConfigWithRawValue(string? rawValue)
    {
        var values = rawValue is null
            ? new Dictionary<string, string?>()
            : new Dictionary<string, string?> { ["Scheduling:MinimumNoticeHours"] = rawValue };
        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }

    private static IClock FixedClock(DateTime now) => new FixedClockStub(now);

    private static DateTime Utc(int year, int month, int day, int hour, int minute) =>
        new(year, month, day, hour, minute, 0, DateTimeKind.Utc);

    private sealed class FixedClockStub(DateTime now) : IClock
    {
        public DateTime UtcNow => now;
    }
}
