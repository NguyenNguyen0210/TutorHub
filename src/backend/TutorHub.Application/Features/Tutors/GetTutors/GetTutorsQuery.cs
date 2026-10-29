using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.GetTutors;

public record GetTutorsQuery(
    Guid? CategoryId = null,
    Guid? SubjectId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    decimal? MinRating = null,
    string? Search = null,
    string? SortBy = "rating",
    string? DegreeLevel = null,
    string? University = null,
    string? Certification = null,
    int? MinExperience = null,
    int? MaxExperience = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<TutorSummaryDto>>;
