using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Queries.AdminGetTopUpRequests;

public record AdminGetTopUpRequestsQuery(
    TopUpRequestStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? RecordId = null,
    bool ReviewableOnly = false) : IRequest<PagedResult<TopUpRequestDto>>;
