using FluentValidation;

namespace TutorHub.Application.Features.Reports.CreateReport;

public class CreateReportCommandValidator : AbstractValidator<CreateReportCommand>
{
    public CreateReportCommandValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .Must(d => !string.IsNullOrWhiteSpace(d) && d.Trim().Length >= 10)
            .WithMessage("Description must be at least 10 non-whitespace characters.")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.EvidenceUrl)
            .MaximumLength(500).WithMessage("Evidence URL cannot exceed 500 characters.")
            .Must(url => string.IsNullOrEmpty(url) || (Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)))
            .WithMessage("Evidence URL must be a valid HTTP or HTTPS URL.");
    }
}
