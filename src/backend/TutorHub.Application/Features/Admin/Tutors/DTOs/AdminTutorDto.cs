using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Admin.Tutors.DTOs;

public record AdminTutorDto(
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
    string Status,
    string? RejectionReason,
    Guid? ReviewedByAdminId,
    DateTime? ReviewedAt,
    decimal RatingAvg,
    int TotalReviews,
    DateTime CreatedAt,
    List<TutorSubjectDto> Subjects
);
