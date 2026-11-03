using MediatR;

namespace TutorHub.Application.Features.Auth.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<bool>;
