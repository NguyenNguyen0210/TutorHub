using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Subjects.GetPublicSubjects;

public record GetPublicSubjectsQuery(
    Guid? CategoryId = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<PagedResult<PublicSubjectDto>>;
