using FluentValidation;

namespace TutorHub.Application.Features.Agreements.Commands.CreateCustomAgreement;

public class CreateCustomAgreementCommandValidator : AbstractValidator<CreateCustomAgreementCommand>
{
    public CreateCustomAgreementCommandValidator()
    {
        RuleFor(x => x.TutorUserId).NotEmpty();
        RuleFor(x => x.StudentProfileId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.TotalPrice)
            .GreaterThanOrEqualTo(50000m)
            .WithMessage("Total price must be at least 50,000 VND.");

        RuleFor(x => x.TotalSessions)
            .InclusiveBetween(1, 100)
            .WithMessage("Total sessions must be between 1 and 100.");

        RuleFor(x => x.SessionDurationMinutes)
            .InclusiveBetween(30, 240)
            .WithMessage("Session duration must be between 30 and 240 minutes.");

        RuleFor(x => x.ValidityDays)
            .InclusiveBetween(1, 30)
            .WithMessage("Validity period must be between 1 and 30 days.");
    }
}
