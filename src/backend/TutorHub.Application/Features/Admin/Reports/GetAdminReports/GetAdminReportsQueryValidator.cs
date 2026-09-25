using FluentValidation;

namespace TutorHub.Application.Features.Admin.Reports.GetAdminReports;

public class GetAdminReportsQueryValidator : AbstractValidator<GetAdminReportsQuery>
{
    public GetAdminReportsQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageNumber must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize must be between 1 and 50.");
    }
}
