using MediatR;
using TutorHub.Application.Features.Auth.DTOs;

namespace TutorHub.Application.Features.Auth.RefreshToken;

public record RefreshTokenCommand(
    string RefreshToken
) : IRequest<RefreshTokenResponseDto>;
