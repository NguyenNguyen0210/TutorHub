namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorMyProfileDto(
    // Profile
    Guid ProfileId,
    Guid UserId,
    string FullName,
    string Email,
    string? Phone,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude,
    decimal RatingAvg,
    int TotalReviews,
    List<TutorSubjectDto> Subjects,
    // Application status (most recent)
    string? ApplicationStatus,
    string? ApplicationRejectionReason
);
