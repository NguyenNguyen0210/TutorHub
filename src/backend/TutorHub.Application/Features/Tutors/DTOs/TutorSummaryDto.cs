namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorSummaryDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    decimal RatingAvg,
    int TotalReviews,
    List<string> Subjects,
    decimal? MinPrice,
    bool IsVerified,
    string? University = null,
    string? Major = null,
    string? DegreeLevel = null,
    string? Certifications = null,
    string? Achievements = null
);
