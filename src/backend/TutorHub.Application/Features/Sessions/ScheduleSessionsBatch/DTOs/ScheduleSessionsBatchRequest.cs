namespace TutorHub.Application.Features.Sessions.ScheduleSessionsBatch.DTOs;

public record SessionScheduleItemDto(Guid SessionId, DateTime StartAt, DateTime EndAt);

public record ScheduleSessionsBatchRequest(List<SessionScheduleItemDto> Items);
