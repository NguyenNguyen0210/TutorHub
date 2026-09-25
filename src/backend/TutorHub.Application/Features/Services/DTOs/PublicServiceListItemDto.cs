namespace TutorHub.Application.Features.Services.DTOs;

public record PublicServiceListItemDto(
    Guid Id,
    string Title,
    string Description,
    string? LearningScope,
    string? ExpectedOutcome,
    Guid SubjectId,
    string SubjectName,
    Guid CategoryId,
    string CategoryName,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    string TeachingMode,
    bool HasTrialLesson,
    Guid TutorProfileId,
    Guid TutorUserId,
    string TutorName,
    string? TutorAvatarUrl,
    decimal TutorRating,
    int TutorTotalReviews,
    int TotalStudents,
    DateTime CreatedAt
);
