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
    string? RejectionReason
);
