using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.DTOs;

public record AdminUserSummaryDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    UserRole Role,
    AccountStatus Status,
    DateTime CreatedAt,
    string? TutorApplicationStatus = null
);
