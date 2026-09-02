using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorApplicationDto(
    Guid Id,
    Guid UserId,
    string Status,
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude,
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
        a.ExperienceYears,
        a.TeachingMode.ToString(),
        a.Address,
        a.Latitude,
        a.Longitude,
        a.RejectionReason,
        a.SubmittedAt,
        a.ReviewedAt
    );
}
