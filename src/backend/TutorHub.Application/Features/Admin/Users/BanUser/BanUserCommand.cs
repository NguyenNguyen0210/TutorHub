using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.BanUser;

public record BanUserCommand(
    Guid UserId,
    Guid AdminId,
    string Reason
) : IRequest<AdminUserSummaryDto>;
