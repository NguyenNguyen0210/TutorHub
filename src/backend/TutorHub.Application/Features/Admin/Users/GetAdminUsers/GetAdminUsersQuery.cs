using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.GetAdminUsers;

public record GetAdminUsersQuery(
    string? Search = null,
    UserRole? Role = null,
    AccountStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminUserSummaryDto>>;
