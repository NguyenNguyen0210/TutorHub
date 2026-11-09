using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Common;

/// <summary>
/// Shared onboarding gate for tutor-only features.
///
/// A <c>TutorProfile</c> only exists after an admin approves the application, so
/// answering "profile not found" for a tutor who has not applied yet, is still
/// under review, or was rejected reads like a broken system. Callers check the
/// profile first and fall back to this gate to explain the real state.
/// </summary>
public static class TutorOnboarding
{
    /// <summary>
    /// Throws a 403 describing the onboarding state unless the tutor is approved.
    /// Returns normally for approved tutors (their profile should exist).
    /// </summary>
    public static async Task EnsureApprovedAsync(
        IAppDbContext context,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var status = await context.TutorApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .Select(a => (TutorApplicationStatus?)a.Status)
            .FirstOrDefaultAsync(cancellationToken);

        if (status == TutorApplicationStatus.Approved)
        {
            return;
        }

        throw status switch
        {
            null => new ForbiddenException(
                "You have not submitted a tutor application yet. Submit your application first."),
            TutorApplicationStatus.Pending => new ForbiddenException(
                "Your tutor application is still under review. This feature unlocks once an admin approves it."),
            _ => new ForbiddenException(
                "Your tutor application was rejected. Resubmit it to unlock tutor features."),
        };
    }
}
