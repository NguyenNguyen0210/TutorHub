using MediatR;
using TutorHub.Application.Features.Admin.Reports.DTOs;

namespace TutorHub.Application.Features.Admin.Reports.GetAdminReportById;

public record GetAdminReportByIdQuery(
    Guid Id
) : IRequest<AdminReportDetailDto>;
