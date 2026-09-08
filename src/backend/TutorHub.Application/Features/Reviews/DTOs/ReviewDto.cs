namespace TutorHub.Application.Features.Reviews.DTOs;

public record ReviewDto(
    Guid Id,
    Guid EnrollmentId,
    Guid TutorProfileId,
    Guid ReviewerUserId,
    string StudentName,
    string? StudentAvatarUrl,
    int Rating,
    string? Comment,
    string? TutorReply,
    DateTime? TutorRepliedAt,
    bool IsRemoved,
    DateTime CreatedAt
);
