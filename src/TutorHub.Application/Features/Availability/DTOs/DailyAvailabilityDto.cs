namespace TutorHub.Application.Features.Availability.DTOs;

public record DailyAvailabilityDto(
    DateOnly Date,
    DayOfWeek DayOfWeek,
    string DayOfWeekName,
    bool HasAvailableSlots,
    List<TimeRangeDto> AvailableSlots,
    List<TimeRangeDto> BookedSlots
);
