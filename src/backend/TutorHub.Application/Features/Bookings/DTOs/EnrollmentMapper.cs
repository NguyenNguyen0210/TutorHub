using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Bookings.DTOs;

/// <summary>
/// F-23 (Đợt 4): single mapping point for Enrollment → EnrollmentDto.
/// </summary>
public static class EnrollmentMapper
{
    public static EnrollmentDto ToDto(Enrollment enrollment, string subjectName)
    {
        return new EnrollmentDto(
            Id: enrollment.Id,
            BookingId: enrollment.BookingId,
            StudentProfileId: enrollment.StudentProfileId,
            TutorProfileId: enrollment.TutorProfileId,
            ServiceId: enrollment.ServiceId,
            SubjectId: enrollment.SubjectId,
            SubjectName: subjectName,
            TotalPrice: enrollment.TotalPrice,
            TotalSessions: enrollment.TotalSessions,
            CompletedSessions: enrollment.CompletedSessions,
            SessionDurationMinutes: enrollment.SessionDurationMinutes,
            TeachingMode: enrollment.TeachingMode,
            Status: enrollment.Status,
            CreatedAt: enrollment.CreatedAt,
            CompletedAt: enrollment.CompletedAt,
            CancelledAt: enrollment.CancelledAt,
            CancelledBy: enrollment.CancelledBy,
            CancellationReason: enrollment.CancellationReason,
            Sessions: SessionMapper.ToOrderedList(enrollment.Sessions)
        );
    }
}
