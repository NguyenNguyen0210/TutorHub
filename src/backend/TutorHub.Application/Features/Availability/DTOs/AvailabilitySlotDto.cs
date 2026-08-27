namespace TutorHub.Application.Features.Availability.DTOs;

public record AvailabilitySlotDto(
    Guid Id,
    DayOfWeek DayOfWeek,
    string DayOfWeekName,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsActive
);
