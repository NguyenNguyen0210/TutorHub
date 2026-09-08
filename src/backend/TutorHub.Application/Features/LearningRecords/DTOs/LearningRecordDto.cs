namespace TutorHub.Application.Features.LearningRecords.DTOs;

public record LearningRecordDto(
    Guid Id,
    Guid SessionId,
    Guid TutorProfileId,
    string Content,
    DateTime CreatedAt
);
