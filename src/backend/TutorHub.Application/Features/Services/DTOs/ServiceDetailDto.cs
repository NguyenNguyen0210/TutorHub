namespace TutorHub.Application.Features.Services.DTOs;

public record CurriculumItemDto(
    int SessionIndex,
    string Title,
    string? Description,
    List<string>? KeyTopics,
    int DurationMinutes
);

public record FaqItemDto(
    string Question,
    string Answer
);

public record ServiceSubjectDto(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName
);

public record ServiceTutorSnapshotDto(
    Guid TutorProfileId,
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string? Bio,
    string? Education,
    int ExperienceYears,
    string? Address,
    decimal RatingAvg,
    int TotalReviews,
    int TotalStudents,
    bool IsVerified
);

public record ServiceReviewItemDto(
    Guid Id,
    string StudentName,
    string? StudentAvatarUrl,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    string? TutorReply,
    DateTime? TutorRepliedAt
);

public record ServiceMetricsDto(
    int EnrolledCount,
    int CompletedCount,
    double SatisfactionRate
);

public record ServiceDetailDto(
    Guid Id,
    string Title,
    string Description,
    string? CoverImageUrl,
    string? TrialLessonUrl,
    string? LearningScope,
    string? ExpectedOutcome,
    List<string> TargetAudience,
    List<string> Prerequisites,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    decimal PricePerSession,
    string TeachingMode,
    string Status,
    DateTime CreatedAt,
    ServiceSubjectDto Subject,
    ServiceTutorSnapshotDto Tutor,
    List<CurriculumItemDto> Curriculum,
    List<FaqItemDto> Faqs,
    ServiceMetricsDto Metrics,
    List<ServiceReviewItemDto> RecentReviews
);
