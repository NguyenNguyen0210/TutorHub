using MediatR;
using TutorHub.Application.Features.Auth.Models;

namespace TutorHub.Application.Features.Auth.GetMe;

public record GetMeQuery(Guid UserId) : IRequest<UserDto>;
