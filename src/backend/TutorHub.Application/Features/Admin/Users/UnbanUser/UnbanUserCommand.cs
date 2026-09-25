using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.UnbanUser;

public record UnbanUserCommand(
    Guid UserId,
    string Reason
) : IRequest<AdminUserSummaryDto>;
