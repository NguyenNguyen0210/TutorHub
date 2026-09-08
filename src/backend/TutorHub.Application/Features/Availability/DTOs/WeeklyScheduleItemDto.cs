namespace TutorHub.Application.Features.Availability.DTOs;

public record WeeklyScheduleItemDto(
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime
);
