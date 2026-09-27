using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Bookings.DTOs;

public static class SessionMapper
{
    public static SessionDto ToDto(Session session)
    {
        return new SessionDto(
            Id: session.Id,
            EnrollmentId: session.EnrollmentId,
            SessionNumber: session.SessionNumber,
            EarningAmount: session.EarningAmount,
            StartAt: session.StartAt,
            EndAt: session.EndAt,
            Status: session.Status,
            IsPayoutReleased: session.IsPayoutReleased,
            CreatedAt: session.CreatedAt,
            CompletedAt: session.CompletedAt,
            CancelledAt: session.CancelledAt,
            GracePeriodStartedAt: session.GracePeriodStartedAt,
            GracePeriodEndsAt: session.GracePeriodEndsAt,
            HasIssueReport: session.HasIssueReport,
            IssueReportReason: session.IssueReportReason,
            IssueReportedAt: session.IssueReportedAt,
            TutorName: session.Enrollment?.TutorProfile?.User?.FullName,
            SubjectName: session.Enrollment?.Subject?.Name
        );
    }

    public static List<SessionDto> ToOrderedList(IEnumerable<Session> sessions)
    {
        return sessions
            .OrderBy(s => s.SessionNumber)
            .Select(ToDto)
            .ToList();
    }
}
