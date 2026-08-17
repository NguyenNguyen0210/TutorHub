using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;

public record GetAdminTutorsQuery(
    TutorProfileStatus? Status = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminTutorDto>>;
