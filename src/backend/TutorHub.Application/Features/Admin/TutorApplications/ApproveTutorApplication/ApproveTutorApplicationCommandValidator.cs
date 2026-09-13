using FluentValidation;

namespace TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;

public class ApproveTutorApplicationCommandValidator : AbstractValidator<ApproveTutorApplicationCommand>
{
    public ApproveTutorApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
    }
}
