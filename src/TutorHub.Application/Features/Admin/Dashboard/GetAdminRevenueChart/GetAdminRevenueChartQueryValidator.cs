using FluentValidation;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminRevenueChart;

public class GetAdminRevenueChartQueryValidator : AbstractValidator<GetAdminRevenueChartQuery>
{
    public GetAdminRevenueChartQueryValidator()
    {
        RuleFor(x => x.Months)
            .InclusiveBetween(1, 24)
            .WithMessage("Months must be between 1 and 24.");
    }
}
