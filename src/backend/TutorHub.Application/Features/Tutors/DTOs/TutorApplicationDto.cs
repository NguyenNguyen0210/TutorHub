using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorApplicationDto(
    Guid Id,
    Guid UserId,
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
    DateTime SubmittedAt,
    DateTime? ReviewedAt
)
{
    public static TutorApplicationDto From(TutorApplication a) => new(
        a.Id,
        a.UserId,
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
        a.SubmittedAt,
        a.ReviewedAt
    );
}
