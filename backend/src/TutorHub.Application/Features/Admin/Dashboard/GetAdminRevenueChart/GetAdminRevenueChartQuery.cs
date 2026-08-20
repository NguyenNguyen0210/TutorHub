using MediatR;
using TutorHub.Application.Features.Admin.Dashboard.DTOs;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminRevenueChart;

public record GetAdminRevenueChartQuery(
    int Months = 6
) : IRequest<RevenueChartDto>;
