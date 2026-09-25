using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyTopUpRequests;

public record GetMyTopUpRequestsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResult<TopUpRequestDto>>;
