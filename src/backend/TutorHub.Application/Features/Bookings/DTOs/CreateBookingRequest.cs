namespace TutorHub.Application.Features.Bookings.DTOs;

public record CreateBookingRequest(
    Guid? ServiceId = null,
    Guid? TutorProfileId = null,
    Guid? SubjectId = null,
    DateTime? StartAt = null,
    DateTime? EndAt = null
);
