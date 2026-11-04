using FluentValidation;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;

public class GetAdminDashboardStatsQueryValidator : AbstractValidator<GetAdminDashboardStatsQuery>
{
    public GetAdminDashboardStatsQueryValidator()
    {
        RuleFor(query => query.Period).IsInEnum();
    }
}
