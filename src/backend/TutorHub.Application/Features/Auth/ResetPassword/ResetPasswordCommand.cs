using MediatR;

namespace TutorHub.Application.Features.Auth.ResetPassword;

public record ResetPasswordCommand(
    string Email,
    string ResetToken,
    string NewPassword
) : IRequest<bool>;
