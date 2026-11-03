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
    decimal RatingAvg,
    int TotalReviews,
    List<TutorSubjectDto> Subjects,
    // Application status (most recent)
    string? ApplicationStatus,
    string? ApplicationRejectionReason
);
