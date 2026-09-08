using MediatR;
using TutorHub.Application.Features.PlatformSettings.DTOs;

namespace TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformRevenueAnalytics;

public record AdminGetPlatformRevenueAnalyticsQuery : IRequest<PlatformRevenueAnalyticsDto>;
