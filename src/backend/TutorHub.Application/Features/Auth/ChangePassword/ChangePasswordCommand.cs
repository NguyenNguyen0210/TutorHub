using MediatR;

namespace TutorHub.Application.Features.Auth.ChangePassword;

public record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword
) : IRequest<bool>;
