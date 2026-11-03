namespace TutorHub.Application.Features.Tutors.Services.DTOs;

public record ServiceSummaryDto(
    Guid Id,
    string Title,
    string SubjectName,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    bool HasTrialLesson,
    string? LearningScope = null,
    string? ExpectedOutcome = null
);
