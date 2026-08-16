namespace TutorHub.Application.Features.Auth.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    string? AvatarUrl,
    Guid? TutorProfileId,
    Guid? StudentProfileId
);
