namespace TutorHub.Application.Features.Users.DTOs;

public record UpdateUserProfileRequest(
    string FullName,
    string? Phone = null,
    string? AvatarUrl = null
);
