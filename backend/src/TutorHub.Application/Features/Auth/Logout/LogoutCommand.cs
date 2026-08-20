using MediatR;

namespace TutorHub.Application.Features.Auth.Logout;

public record LogoutCommand(string RefreshToken) : IRequest<bool>;
