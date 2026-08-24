using FluentValidation;

namespace TutorHub.Application.Features.Admin.Reports.ResolveReport;

public class ResolveReportCommandValidator : AbstractValidator<ResolveReportCommand>
{
    public ResolveReportCommandValidator()
    {
        RuleFor(x => x.Decision)
            .IsInEnum().WithMessage("A valid report decision is required.");

        RuleFor(x => x.Resolution)
            .NotEmpty().WithMessage("Resolution description is required.")
            .Must(r => !string.IsNullOrWhiteSpace(r) && r.Trim().Length >= 5)
            .WithMessage("Resolution must be at least 5 non-whitespace characters.")
            .MaximumLength(1000).WithMessage("Resolution cannot exceed 1000 characters.");
    }
}
