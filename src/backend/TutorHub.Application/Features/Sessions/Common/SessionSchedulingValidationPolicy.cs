using TutorHub.Application.Common.Exceptions;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Sessions.Common;

/// <summary>
/// Canonical scheduling validation policy.
/// Shared across initial Session Scheduling and Session Rescheduling to guarantee 100% semantic consistency.
/// </summary>
public static class SessionSchedulingValidationPolicy
{
    public static void ValidateUtc(DateTime startAt, DateTime endAt)
    {
        if (startAt.Kind != DateTimeKind.Utc || endAt.Kind != DateTimeKind.Utc)
        {
            throw new BadRequestException("StartAt and EndAt must be in UTC format (ISO 8601 with Z).");
        }
    }

    public static void ValidateDuration(DateTime startAt, DateTime endAt, int expectedDurationMinutes)
    {
        if (!SessionSchedulingRules.IsValidDuration(startAt, endAt, expectedDurationMinutes))
        {
            throw new BadRequestException($"Session duration must be exactly {expectedDurationMinutes} minutes according to the purchased service package.");
        }
    }
}
