namespace TutorHub.Application.Features.Tutors.Services.DTOs;

using TutorHub.Application.Features.Services.DTOs;

public record ServiceDto(
    Guid Id,
    Guid TutorProfileId,
    Guid SubjectId,
    string SubjectName,
    string SubjectCategoryName,
    string Title,
    string Description,
    string? ShortDescription,
    List<string> Tags,
    string? LearningScope,
    string? ExpectedOutcome,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    string TeachingMode,
    string? TrialLessonUrl,
    string? CoverImageUrl,
    string Status,
    int StudentCount,
    double? AverageRating,
    int ReviewCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<CurriculumItemDto> Curriculum,
    List<string> TargetAudience,
    List<string> Prerequisites,
    List<FaqItemDto> Faqs
);
