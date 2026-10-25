namespace TutorHub.Domain.Services;

/// <summary>
/// Pure domain logic rules for session scheduling, minimum notice, duration, and overlap detection.
/// Zero external dependencies, pure business invariants.
/// </summary>
public static class SessionSchedulingRules
{
    /// <summary>
    /// Checks if the time range has a positive duration (EndAt must strictly succeed StartAt).
    /// </summary>
    public static bool IsValidTimeRange(DateTime startAt, DateTime endAt)
    {
        return endAt > startAt;
    }

    /// <summary>
    /// Checks if the session duration exactly matches the expected duration in minutes.
    /// </summary>
    public static bool IsValidDuration(DateTime startAt, DateTime endAt, int expectedDurationMinutes)
    {
        return (endAt - startAt) == TimeSpan.FromMinutes(expectedDurationMinutes);
    }

    /// <summary>
    /// Checks if the requested start time satisfies the minimum advance notice duration from <paramref name="now"/>.
    /// </summary>
    public static bool HasSufficientNotice(DateTime startAt, DateTime now, TimeSpan minNotice)
    {
        return startAt >= now.Add(minNotice);
    }

    /// <summary>
    /// Checks if a proposed session window [startAt, endAt) collides with any existing scheduled session slots.
    /// Standard half-open interval overlap: A.Start &lt; B.End &amp;&amp; B.Start &lt; A.End.
    /// </summary>
    public static bool HasOverlap(
        DateTime startAt,
        DateTime endAt,
        IEnumerable<(DateTime StartAt, DateTime? EndAt)> existingScheduledSlots)
    {
        if (existingScheduledSlots == null)
        {
            return false;
        }

        return existingScheduledSlots.Any(s =>
            startAt < (s.EndAt ?? DateTime.MaxValue) &&
            s.StartAt < endAt);
    }
}
