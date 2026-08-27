using FluentValidation;

namespace TutorHub.Application.Features.Admin.Tutors.RejectTutor;

public class RejectTutorCommandValidator : AbstractValidator<RejectTutorCommand>
{
    public RejectTutorCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MaximumLength(500).WithMessage("Rejection reason cannot exceed 500 characters.");
    }
}
