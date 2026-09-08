using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Bookings.DTOs;

/// <summary>
/// F-23 (Đợt 4): single mapping point for Session → SessionDto.
/// Previously duplicated inline at 9 handler sites; adding a field
/// required touching all of them.
/// </summary>
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
            StudentAttendance: session.StudentAttendance,
            TutorAttendance: session.TutorAttendance,
            HasAttendanceConflict: session.HasAttendanceConflict
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
