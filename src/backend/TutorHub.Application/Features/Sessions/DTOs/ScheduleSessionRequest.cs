namespace TutorHub.Application.Features.Sessions.DTOs;

public record ScheduleSessionRequest(
    DateTime StartAt,
    DateTime EndAt
);
