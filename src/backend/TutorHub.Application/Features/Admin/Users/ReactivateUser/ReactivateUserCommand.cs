using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.ReactivateUser;

public record ReactivateUserCommand(
    Guid UserId,
    Guid AdminId
) : IRequest<AdminUserSummaryDto>;
