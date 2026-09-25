using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Admin.TutorApplications.DTOs;

public record AdminTutorApplicationDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    string? UserPhone,
    string? UserAvatarUrl,
    string Status,
    string Bio,
    string Education,
    string? University,
    string? Major,
    string? DegreeLevel,
    string? Certifications,
    string? Subject,
    string? SubjectSub,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude,
    string? Methodology,
    string? Achievements,
    string? DocumentsJson,
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
        a.User.Phone,
        a.User.AvatarUrl,
        a.Status.ToString(),
        a.Bio,
        a.Education,
        a.University,
        a.Major,
        a.DegreeLevel,
        a.Certifications,
        a.Subject,
        a.SubjectSub,
        a.ExperienceYears,
        a.TeachingMode.ToString(),
        a.Address,
        a.Latitude,
        a.Longitude,
        a.Methodology,
        a.Achievements,
        a.DocumentsJson,
        a.RejectionReason,
        a.ReviewedByAdminId,
        a.ReviewedAt,
        a.SubmittedAt
    );
}
