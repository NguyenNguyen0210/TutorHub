using TutorHub.Application.Common.Exceptions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Availability.Common;

/// <summary>
/// Domain and application policy for tutor availability mutations (INV-AVAIL-005, INV-AVAIL-006).
/// Ensures that availability changes do not leave active future scheduled sessions uncovered.
/// </summary>
public static class AvailabilityMutationPolicy
{
    public static readonly TimeZoneInfo CanonicalTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");

    /// <summary>
    /// Evaluates concrete future scheduled sessions against a proposed weekly availability schedule.
    /// If any future scheduled session is left uncovered, throws ConflictException (fail-fast).
    /// </summary>
    public static void EnsureNoFutureScheduledSessionsUncovered(
        IEnumerable<(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime)> proposedSchedule,
        IEnumerable<Session> futureScheduledSessions)
    {
        var scheduleList = proposedSchedule.ToList();

        foreach (var session in futureScheduledSessions)
        {
            if (session.Status != SessionStatus.Scheduled || !session.StartAt.HasValue || !session.EndAt.HasValue)
            {
                continue;
            }

            // Convert session UTC times to localized canonical timezone
            var localStart = TimeZoneInfo.ConvertTimeFromUtc(session.StartAt.Value, CanonicalTimeZone);
            var localEnd = TimeZoneInfo.ConvertTimeFromUtc(session.EndAt.Value, CanonicalTimeZone);

            var sessionDayOfWeek = localStart.DayOfWeek;
            var sessionStartTime = TimeOnly.FromDateTime(localStart);
            var sessionEndTime = TimeOnly.FromDateTime(localEnd);

            // Check if this concrete session is enclosed in at least one window of the proposed schedule
            var isCovered = scheduleList.Any(w =>
                w.DayOfWeek == sessionDayOfWeek &&
                sessionStartTime >= w.StartTime &&
                sessionEndTime <= w.EndTime);

            if (!isCovered)
            {
                throw new ConflictException(
                    $"Cannot modify availability schedule because an upcoming session on " +
                    $"{localStart:yyyy-MM-dd} ({localStart:HH:mm} - {localEnd:HH:mm}) " +
                    $"would be left without an active availability window.");
            }
        }
    }
}
