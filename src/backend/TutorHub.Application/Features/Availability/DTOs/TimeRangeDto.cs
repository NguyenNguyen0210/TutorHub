namespace TutorHub.Application.Features.Availability.DTOs;

public record TimeRangeDto(
    TimeOnly StartTime,
    TimeOnly EndTime
);
