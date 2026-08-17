namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorSummaryDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    decimal HourlyRate,
    string TeachingMode,
    string? Address,
    decimal RatingAvg,
    int TotalReviews,
    List<string> Subjects
);
