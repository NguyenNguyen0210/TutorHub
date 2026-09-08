namespace TutorHub.Application.Features.Tutors.Services.DTOs;

public record ServiceDto(
    Guid Id,
    Guid TutorProfileId,
    Guid SubjectId,
    string SubjectName,
    string SubjectCategoryName,
    string Title,
    string Description,
    string? LearningScope,
    string? ExpectedOutcome,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    string TeachingMode,
    string? TrialLessonUrl,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
