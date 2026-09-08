using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.SuspendUser;

public record SuspendUserCommand(
    Guid UserId,
    Guid AdminId,
    string Reason
) : IRequest<AdminUserSummaryDto>;
