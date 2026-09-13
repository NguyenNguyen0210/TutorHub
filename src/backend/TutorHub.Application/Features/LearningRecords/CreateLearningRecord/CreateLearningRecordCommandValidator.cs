using FluentValidation;

namespace TutorHub.Application.Features.LearningRecords.CreateLearningRecord;

public class CreateLearningRecordCommandValidator : AbstractValidator<CreateLearningRecordCommand>
{
    public CreateLearningRecordCommandValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Learning record content is required.")
            .MaximumLength(2000).WithMessage("Learning record content cannot exceed 2000 characters.");
    }
}
