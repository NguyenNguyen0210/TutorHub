using MediatR;
using TutorHub.Application.Features.Admin.Users.DTOs;

namespace TutorHub.Application.Features.Admin.Users.GetAdminUserById;

public record GetAdminUserByIdQuery(
    Guid UserId
) : IRequest<AdminUserDetailDto>;
