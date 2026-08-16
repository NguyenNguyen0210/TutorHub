namespace TutorHub.Application.Features.Auth.Models;

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    UserDto User
);
