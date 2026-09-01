namespace TutorHub.Application.Features.Tutors.Services.DTOs;

public record CreateServiceRequest(
    Guid SubjectId,
    string Title,
    string Description,
    string? LearningScope,
    string? ExpectedOutcome,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    string TeachingMode,
    string? TrialLessonUrl
);
