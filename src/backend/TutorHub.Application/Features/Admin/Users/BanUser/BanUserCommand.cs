using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.BanUser;

public record BanUserCommand(
    Guid UserId,
    string Reason
) : IRequest<AdminUserSummaryDto>;
