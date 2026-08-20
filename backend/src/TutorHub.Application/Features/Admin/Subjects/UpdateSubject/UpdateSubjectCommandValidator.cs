using FluentValidation;

namespace TutorHub.Application.Features.Admin.Subjects.UpdateSubject;

public class UpdateSubjectCommandValidator : AbstractValidator<UpdateSubjectCommand>
{
    public UpdateSubjectCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Subject name is required.")
            .Must(n => !string.IsNullOrWhiteSpace(n))
            .WithMessage("Subject name cannot be empty.")
            .MaximumLength(100).WithMessage("Subject name cannot exceed 100 characters.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("CategoryId is required.");
    }
}
