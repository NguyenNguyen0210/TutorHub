using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.GetAdminSubjects;

public record GetAdminSubjectsQuery(
    Guid? CategoryId = null,
    bool? IsActive = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminSubjectDto>>;
