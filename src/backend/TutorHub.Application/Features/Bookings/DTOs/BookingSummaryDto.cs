using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record BookingSummaryDto(
    Guid Id,
    Guid StudentProfileId,
    string StudentName,
    Guid TutorProfileId,
    string TutorName,
    Guid SubjectId,
    string SubjectName,
    Guid? ServiceId,
    decimal TotalPrice,
    int TotalSessions,
    BookingStatus Status,
    DateTime CreatedAt
);
