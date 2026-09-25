namespace TutorHub.Application.Features.Tutors.Services.DTOs;

public record CreateServiceRequest(
    Guid SubjectId,
    string Title,
    string Description,
    string? ShortDescription,
    string[]? Tags,
    string? LearningScope,
    string? ExpectedOutcome,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    string TeachingMode,
    string? TrialLessonUrl,
    string? CoverImageUrl
);
