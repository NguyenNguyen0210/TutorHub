using FluentValidation;

namespace TutorHub.Application.Features.Sessions.ReportSessionIssue;

public class ReportSessionIssueCommandValidator : AbstractValidator<ReportSessionIssueCommand>
{
    public ReportSessionIssueCommandValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MinimumLength(20).MaximumLength(2000);
    }
}
