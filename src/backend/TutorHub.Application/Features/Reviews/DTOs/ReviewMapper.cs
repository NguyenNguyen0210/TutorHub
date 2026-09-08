using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Reviews.DTOs;

/// <summary>
/// F-23 (Đợt 4): single mapping point for Review → ReviewDto.
/// </summary>
public static class ReviewMapper
{
    public static ReviewDto ToDto(
        Review review,
        Guid tutorProfileId,
        Guid reviewerUserId,
        string studentName,
        string? studentAvatarUrl)
    {
        return new ReviewDto(
            Id: review.Id,
            EnrollmentId: review.EnrollmentId,
            TutorProfileId: tutorProfileId,
            ReviewerUserId: reviewerUserId,
            StudentName: studentName,
            StudentAvatarUrl: studentAvatarUrl,
            Rating: review.Rating,
            Comment: review.Comment,
            TutorReply: review.TutorReply,
            TutorRepliedAt: review.TutorRepliedAt,
            IsRemoved: review.IsRemoved,
            CreatedAt: review.CreatedAt
        );
    }
}
