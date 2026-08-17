using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetTutors;

public record GetTutorsQuery(
    Guid? SubjectId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    TeachingMode? TeachingMode = null,
    decimal? MinRating = null,
    string? Search = null,
    string? SortBy = "rating",
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<TutorSummaryDto>>;
