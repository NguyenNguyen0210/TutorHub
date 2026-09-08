namespace TutorHub.Application.Features.Reviews.DTOs;

public record CreateEnrollmentReviewRequest(
    int Rating,
    string? Comment = null
);
