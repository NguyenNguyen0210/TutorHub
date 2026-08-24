using MediatR;
using TutorHub.Application.Features.Admin.Dashboard.DTOs;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;

public record GetAdminDashboardStatsQuery : IRequest<AdminDashboardStatsDto>;
