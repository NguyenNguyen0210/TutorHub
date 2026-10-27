namespace TutorHub.Application.Features.Sessions.Scheduling;

/// <summary>
/// Application policy interface for validating session scheduling, minimum notice, and tutor time slot overlaps.
/// </summary>
public interface ISessionSchedulePolicy
{
    void RequireSchedulable(DateTime startAt, DateTime endAt);

    void RequireSchedulable(DateTime startAt, DateTime endAt, string operation);

    void RequireMinimumNotice(DateTime startAt, DateTime endAt, string operation = "cancelled");

    void RequireNoOverlap(
        Guid tutorProfileId,
        DateTime startAt,
        DateTime endAt,
        IEnumerable<(Guid TutorProfileId, DateTime StartAt, DateTime? EndAt, string Status)> existing);
}

