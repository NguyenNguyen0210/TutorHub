namespace TutorHub.Application.Features.Admin.TutorApplications.DTOs;

public record AdminTutorApplicationListItemDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    string? UserAvatarUrl,
    string Status,
    DateTime SubmittedAt,
    DateTime? ReviewedAt,
    string? RejectionReason,
    string? Bio = null,
    string? Education = null,
    int ExperienceYears = 0,
    string? TeachingMode = null,
    string? Address = null
);
