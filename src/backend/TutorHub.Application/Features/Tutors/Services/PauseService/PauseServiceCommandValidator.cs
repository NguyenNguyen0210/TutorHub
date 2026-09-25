using FluentValidation;

namespace TutorHub.Application.Features.Tutors.Services.PauseService;

public class PauseServiceCommandValidator : AbstractValidator<PauseServiceCommand>
{
    public PauseServiceCommandValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
    }
}
