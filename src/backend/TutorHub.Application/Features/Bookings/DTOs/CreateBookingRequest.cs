namespace TutorHub.Application.Features.Bookings.DTOs;

public record CreateBookingRequest(
    Guid TutorProfileId,
    Guid SubjectId,
    DateTime StartAt,
    DateTime EndAt
);
