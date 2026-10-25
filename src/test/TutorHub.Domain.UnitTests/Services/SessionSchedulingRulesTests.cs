using FluentAssertions;
using TutorHub.Domain.Services;
using Xunit;

namespace TutorHub.Domain.UnitTests.Services;

public class SessionSchedulingRulesTests
{
    private static readonly DateTime BaseTime = new(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void IsValidTimeRange_WhenEndAfterStart_ReturnsTrue()
    {
        var start = BaseTime;
        var end = start.AddHours(1);

        SessionSchedulingRules.IsValidTimeRange(start, end).Should().BeTrue();
    }

    [Fact]
    public void IsValidTimeRange_WhenEndEqualsStart_ReturnsFalse()
    {
        var start = BaseTime;
        var end = start;

        SessionSchedulingRules.IsValidTimeRange(start, end).Should().BeFalse();
    }

    [Fact]
    public void IsValidTimeRange_WhenEndBeforeStart_ReturnsFalse()
    {
        var start = BaseTime;
        var end = start.AddMinutes(-1);

        SessionSchedulingRules.IsValidTimeRange(start, end).Should().BeFalse();
    }

    [Fact]
    public void HasSufficientNotice_WhenStartAtOrAfterNoticeThreshold_ReturnsTrue()
    {
        var now = BaseTime;
        var notice = TimeSpan.FromHours(2);

        // Exactly at notice threshold
        SessionSchedulingRules.HasSufficientNotice(now.AddHours(2), now, notice).Should().BeTrue();

        // More notice than required
        SessionSchedulingRules.HasSufficientNotice(now.AddHours(3), now, notice).Should().BeTrue();
    }

    [Fact]
    public void HasSufficientNotice_WhenStartBeforeNoticeThreshold_ReturnsFalse()
    {
        var now = BaseTime;
        var notice = TimeSpan.FromHours(2);

        // 1 second before notice threshold
        SessionSchedulingRules.HasSufficientNotice(now.AddHours(2).AddSeconds(-1), now, notice).Should().BeFalse();

        // Past start time
        SessionSchedulingRules.HasSufficientNotice(now.AddHours(-1), now, notice).Should().BeFalse();
    }

    [Fact]
    public void HasSufficientNotice_WhenZeroNotice_OnlyRequiresStartNotBeInPast()
    {
        var now = BaseTime;
        var notice = TimeSpan.Zero;

        SessionSchedulingRules.HasSufficientNotice(now, now, notice).Should().BeTrue();
        SessionSchedulingRules.HasSufficientNotice(now.AddMinutes(1), now, notice).Should().BeTrue();
        SessionSchedulingRules.HasSufficientNotice(now.AddMinutes(-1), now, notice).Should().BeFalse();
    }

    [Theory]
    [InlineData("10:00", "12:00", "10:30", "11:30", true)]  // Proposed is inside existing
    [InlineData("10:30", "11:30", "10:00", "12:00", true)]  // Proposed wraps existing
    [InlineData("10:00", "11:30", "11:00", "12:00", true)]  // Proposed overlaps start of existing
    [InlineData("11:00", "12:30", "10:00", "11:30", true)]  // Proposed overlaps end of existing
    [InlineData("10:00", "11:00", "10:00", "11:00", true)]  // Exact match
    [InlineData("09:00", "10:00", "10:00", "11:00", false)] // Adjacent before (touches at 10:00)
    [InlineData("11:00", "12:00", "10:00", "11:00", false)] // Adjacent after (touches at 11:00)
    [InlineData("08:00", "09:00", "10:00", "11:00", false)] // Disjoint before
    [InlineData("12:00", "13:00", "10:00", "11:00", false)] // Disjoint after
    public void HasOverlap_EvaluatesHalfOpenIntervalsCorrectly(
        string propStart, string propEnd, string existStart, string existEnd, bool expectedOverlap)
    {
        var proposedStart = DateTime.Parse($"2026-10-25T{propStart}:00Z").ToUniversalTime();
        var proposedEnd = DateTime.Parse($"2026-10-25T{propEnd}:00Z").ToUniversalTime();

        var existingSlot = (
            StartAt: DateTime.Parse($"2026-10-25T{existStart}:00Z").ToUniversalTime(),
            EndAt: (DateTime?)DateTime.Parse($"2026-10-25T{existEnd}:00Z").ToUniversalTime()
        );

        var hasOverlap = SessionSchedulingRules.HasOverlap(
            proposedStart,
            proposedEnd,
            new[] { existingSlot });

        hasOverlap.Should().Be(expectedOverlap);
    }

    [Fact]
    public void HasOverlap_WhenExistingSlotHasNullEndAt_TreatsAsOpenEnded()
    {
        var existingStart = BaseTime.AddHours(2);
        var existingSlot = (StartAt: existingStart, EndAt: (DateTime?)null);

        // Proposed session collides with open-ended slot starting at +2h
        SessionSchedulingRules.HasOverlap(
            BaseTime.AddHours(3),
            BaseTime.AddHours(4),
            new[] { existingSlot }).Should().BeTrue();

        // Proposed session before the open-ended slot does not collide
        SessionSchedulingRules.HasOverlap(
            BaseTime,
            BaseTime.AddHours(1),
            new[] { existingSlot }).Should().BeFalse();
    }

    [Fact]
    public void IsValidDuration_WhenDurationMatchesMinutes_ReturnsTrue()
    {
        var start = BaseTime;
        var end = start.AddMinutes(60);

        SessionSchedulingRules.IsValidDuration(start, end, 60).Should().BeTrue();
    }

    [Theory]
    [InlineData(59)]
    [InlineData(61)]
    [InlineData(0)]
    public void IsValidDuration_WhenDurationDiffersFromMinutes_ReturnsFalse(int expectedDuration)
    {
        var start = BaseTime;
        var end = start.AddMinutes(60);

        SessionSchedulingRules.IsValidDuration(start, end, expectedDuration).Should().BeFalse();
    }

    [Fact]
    public void HasOverlap_WhenNoExistingSlots_ReturnsFalse()
    {
        var start = BaseTime;
        var end = start.AddHours(1);

        SessionSchedulingRules.HasOverlap(start, end, Enumerable.Empty<(DateTime, DateTime?)>()).Should().BeFalse();
        SessionSchedulingRules.HasOverlap(start, end, null!).Should().BeFalse();
    }
}

