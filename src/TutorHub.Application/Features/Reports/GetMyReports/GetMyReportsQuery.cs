using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.DTOs;

namespace TutorHub.Application.Features.Reports.GetMyReports;

public record GetMyReportsQuery(
    Guid UserId,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<UserReportDetailDto>>;
