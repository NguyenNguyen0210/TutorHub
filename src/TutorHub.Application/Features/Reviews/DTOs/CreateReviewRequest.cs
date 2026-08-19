namespace TutorHub.Application.Features.Reviews.DTOs;

public record CreateReviewRequest(
    int Rating,
    string? Comment = null
);
