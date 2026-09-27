using FluentValidation;

namespace TutorHub.Application.Features.Tutors.Services.ResumeService;

public class ResumeServiceCommandValidator : AbstractValidator<ResumeServiceCommand>
{
    public ResumeServiceCommandValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
    }
}
