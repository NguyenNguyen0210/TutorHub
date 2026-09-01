using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Admin.TutorApplications.DTOs;

public record AdminTutorApplicationDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    string? UserAvatarUrl,
    string Status,
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude,
    string? RejectionReason,
    Guid? ReviewedByAdminId,
    DateTime? ReviewedAt,
    DateTime SubmittedAt
)
{
    public static AdminTutorApplicationDto From(TutorApplication a) => new(
        a.Id,
        a.UserId,
        a.User.FullName,
        a.User.Email,
        a.User.AvatarUrl,
        a.Status.ToString(),
        a.Bio,
        a.Education,
        a.ExperienceYears,
        a.TeachingMode.ToString(),
        a.Address,
        a.Latitude,
        a.Longitude,
        a.RejectionReason,
        a.ReviewedByAdminId,
        a.ReviewedAt,
        a.SubmittedAt
    );
}
