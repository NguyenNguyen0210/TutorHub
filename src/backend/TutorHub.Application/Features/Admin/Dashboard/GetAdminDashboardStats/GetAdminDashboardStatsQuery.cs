using MediatR;
using TutorHub.Application.Features.Admin.Dashboard.DTOs;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;

public enum DashboardPeriod { All, Today, SevenDays, ThirtyDays }

public record GetAdminDashboardStatsQuery(DashboardPeriod Period = DashboardPeriod.All) : IRequest<AdminDashboardStatsDto>;
