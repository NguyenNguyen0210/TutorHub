using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Users.DTOs;

public record MyProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt
);
