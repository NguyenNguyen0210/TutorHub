using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.TutorApplications.GetAdminTutorApplications;

public record GetAdminTutorApplicationsQuery(
    TutorApplicationStatus? Status = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminTutorApplicationListItemDto>>;
