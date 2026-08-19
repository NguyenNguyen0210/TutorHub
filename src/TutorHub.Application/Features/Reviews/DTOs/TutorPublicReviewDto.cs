namespace TutorHub.Application.Features.Reviews.DTOs;

public record TutorPublicReviewDto(
    Guid Id,
    string ReviewerName,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);
