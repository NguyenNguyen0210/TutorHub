using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Common;

/// <summary>
/// Canonical scheduling validation policy (INV-RESCHED-005).
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
        var duration = endAt - startAt;
        if (duration != TimeSpan.FromMinutes(expectedDurationMinutes))
        {
            throw new BadRequestException($"Session duration must be exactly {expectedDurationMinutes} minutes according to the purchased service package.");
        }
    }

    public static async Task CheckTutorSessionOverlapAsync(
        Guid tutorProfileId,
        Guid excludeSessionId,
        DateTime startAt,
        DateTime endAt,
        IAppDbContext context,
        CancellationToken cancellationToken)
    {
        var hasSessionConflict = await context.Sessions
            .AnyAsync(s => s.Id != excludeSessionId &&
                           s.Enrollment.TutorProfileId == tutorProfileId &&
                           s.Status == SessionStatus.Scheduled &&
                           s.StartAt < endAt && startAt < s.EndAt,
                      cancellationToken);

        if (hasSessionConflict)
        {
            throw new ConflictException("The tutor already has another scheduled session during this time slot.");
        }
    }
}
