namespace TutorHub.Application.Features.Auth.DTOs;

public record GetMeResponseDto(
    Guid Id,
    Guid UserId,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    string Status,
    string? AvatarUrl,
    Guid? IdProfile
);
