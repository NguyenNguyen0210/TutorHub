namespace TutorHub.Application.Features.Auth.Models;

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

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    UserDto User
);
