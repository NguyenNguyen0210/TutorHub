using FluentValidation;

namespace TutorHub.Application.Features.LearningRecords.GetLearningRecord;

public class GetLearningRecordQueryValidator : AbstractValidator<GetLearningRecordQuery>
{
    public GetLearningRecordQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.SessionId).NotEmpty();
    }
}
