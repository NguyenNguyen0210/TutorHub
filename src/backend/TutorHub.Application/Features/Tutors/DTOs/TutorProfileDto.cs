namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorProfileDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string? Phone,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    decimal HourlyRate,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude,
    string Status,
    string? RejectionReason,
    decimal RatingAvg,
    int TotalReviews,
    List<TutorSubjectDto> Subjects
);
