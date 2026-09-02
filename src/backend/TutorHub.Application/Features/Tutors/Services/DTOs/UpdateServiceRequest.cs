namespace TutorHub.Application.Features.Tutors.Services.DTOs;

public record UpdateServiceRequest(
    string? Title,
    string? Description,
    string? LearningScope,
    string? ExpectedOutcome,
    int? TotalSessions,
    int? SessionDurationMinutes,
    decimal? Price,
    string? TeachingMode,
    string? TrialLessonUrl
);
