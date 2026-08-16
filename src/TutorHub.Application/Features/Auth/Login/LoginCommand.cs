using MediatR;
using TutorHub.Application.Features.Auth.Models;

namespace TutorHub.Application.Features.Auth.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResponseDto>;
