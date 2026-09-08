using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Admin.TutorApplications.DTOs;

public record AdminTutorProfileDto(
    Guid ProfileId,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    string? UserAvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    string LatestApplicationStatus,
    decimal RatingAvg,
    int TotalReviews,
    DateTime UserCreatedAt,
    List<TutorSubjectDto> Subjects
);
