namespace TutorHub.Application.Features.Reviews.DTOs;

public record TutorPublicReviewDto(
    Guid Id,
    Guid EnrollmentId,
    string StudentName,
    string? StudentAvatarUrl,
    int Rating,
    string? Comment,
    string? TutorReply,
    DateTime? TutorRepliedAt,
    DateTime CreatedAt
);
