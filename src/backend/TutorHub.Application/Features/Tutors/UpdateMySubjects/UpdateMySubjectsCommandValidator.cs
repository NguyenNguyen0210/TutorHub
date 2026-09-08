using FluentValidation;

namespace TutorHub.Application.Features.Tutors.UpdateMySubjects;

public class UpdateMySubjectsCommandValidator : AbstractValidator<UpdateMySubjectsCommand>
{
    public UpdateMySubjectsCommandValidator()
    {
        RuleFor(x => x.Subjects)
            .NotNull().WithMessage("Subjects list cannot be null.");

        RuleForEach(x => x.Subjects).ChildRules(subject =>
        {
            subject.RuleFor(s => s.SubjectId)
                .NotEmpty().WithMessage("Subject ID is required.");
        });
    }
}
