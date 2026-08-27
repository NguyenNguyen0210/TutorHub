using MediatR;

namespace TutorHub.Application.Features.Auth.ChangePassword;

public record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword
) : IRequest<bool>;
