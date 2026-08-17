using MediatR;
using TutorHub.Application.Features.Auth.DTOs;

namespace TutorHub.Application.Features.Auth.GetMe;

public record GetMeQuery(Guid UserId) : IRequest<RegisterResponseDto>;
