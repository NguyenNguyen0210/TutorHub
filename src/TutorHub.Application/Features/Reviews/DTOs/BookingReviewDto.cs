namespace TutorHub.Application.Features.Reviews.DTOs;

public record BookingReviewDto(
    Guid Id,
    Guid BookingId,
    Guid ReviewerUserId,
    string ReviewerName,
    Guid RevieweeUserId,
    string RevieweeName,
    int Rating,
    string? Comment,
    bool IsPublic,
    DateTime CreatedAt
);
