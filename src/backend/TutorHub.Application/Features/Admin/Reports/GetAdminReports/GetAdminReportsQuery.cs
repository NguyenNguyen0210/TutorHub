using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Reports.GetAdminReports;

public record GetAdminReportsQuery(
    ReportStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<ReportSummaryDto>>;
