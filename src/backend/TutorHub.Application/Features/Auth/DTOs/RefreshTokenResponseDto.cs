namespace TutorHub.Application.Features.Auth.DTOs;

public record RefreshTokenResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt
);
