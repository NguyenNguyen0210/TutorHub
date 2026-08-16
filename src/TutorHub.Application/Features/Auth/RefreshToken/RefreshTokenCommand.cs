using MediatR;
using TutorHub.Application.Features.Auth.Models;

namespace TutorHub.Application.Features.Auth.RefreshToken;

public record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken
) : IRequest<AuthResponseDto>;
