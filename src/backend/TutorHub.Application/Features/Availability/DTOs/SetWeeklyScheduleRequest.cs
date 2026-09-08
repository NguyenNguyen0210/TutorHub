namespace TutorHub.Application.Features.Availability.DTOs;

public record SetWeeklyScheduleRequest(
    List<WeeklyScheduleItemDto> Schedule
);
