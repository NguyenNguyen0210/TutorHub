using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.GetTutorReviews;

public record GetTutorReviewsQuery(
    Guid TutorProfileId,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<TutorPublicReviewDto>>;
