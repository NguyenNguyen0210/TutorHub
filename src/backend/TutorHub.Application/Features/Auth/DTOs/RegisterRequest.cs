namespace TutorHub.Application.Features.Auth.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? Phone,
    string Role
);
