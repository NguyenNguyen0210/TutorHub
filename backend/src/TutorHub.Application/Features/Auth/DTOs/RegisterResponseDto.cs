namespace TutorHub.Application.Features.Auth.DTOs;

public record RegisterResponseDto(
    Guid UserId,
    string Email,
    string FullName,
    string? Phone,
    string Role
);
