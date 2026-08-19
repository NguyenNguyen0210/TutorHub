namespace TutorHub.Application.Features.Availability.DTOs;

public record TutorAvailabilityDto(
    Guid TutorProfileId,
    DateOnly FromDate,
    DateOnly ToDate,
    List<DailyAvailabilityDto> Days
);
