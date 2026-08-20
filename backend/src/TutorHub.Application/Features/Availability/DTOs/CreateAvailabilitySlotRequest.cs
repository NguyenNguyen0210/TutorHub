namespace TutorHub.Application.Features.Availability.DTOs;

public record CreateAvailabilitySlotRequest(
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime
);
