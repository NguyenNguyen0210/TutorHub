namespace TutorHub.Application.Features.Users.DTOs;

public record UpdateMyProfileRequest(
    string FullName,
    string? Phone = null,
    string? AvatarUrl = null
);
