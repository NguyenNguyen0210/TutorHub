using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Services.GetPublicServices;

public record GetPublicServicesQuery(
    Guid? CategoryId = null,
    Guid? SubjectId = null,
    TeachingMode? TeachingMode = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    decimal? MinRating = null,
    string? Search = null,
    string? SortBy = null,
    int PageNumber = 1,
    int PageSize = 12
) : IRequest<PagedResult<PublicServiceListItemDto>>;
