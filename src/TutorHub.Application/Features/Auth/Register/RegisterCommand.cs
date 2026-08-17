using MediatR;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone,
    UserRole Role
) : IRequest<RegisterResponseDto>;
