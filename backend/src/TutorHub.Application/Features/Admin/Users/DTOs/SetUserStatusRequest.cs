namespace TutorHub.Application.Features.Admin.Users.DTOs;

public record SetUserStatusRequest(
    bool IsActive,
    string? Reason = null
);
