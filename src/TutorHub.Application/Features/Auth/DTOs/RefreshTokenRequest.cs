namespace TutorHub.Application.Features.Auth.DTOs;

public record RefreshTokenRequest(
    string AccessToken,
    string RefreshToken
);
