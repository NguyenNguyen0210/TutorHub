using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.SetUserStatus;

public record SetUserStatusCommand(
    Guid UserId,
    Guid AdminId,
    bool IsActive,
    string? Reason = null
) : IRequest<AdminUserSummaryDto>;
