using FluentValidation;

namespace TutorHub.Application.Features.Sessions.ScheduleSessionsBatch;

public class ScheduleSessionsBatchValidator : AbstractValidator<ScheduleSessionsBatchCommand>
{
    public ScheduleSessionsBatchValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Items is required.")
            .Must(items => items.Count <= 50).WithMessage("Items must not exceed 50.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.SessionId)
                .NotEmpty().WithMessage("SessionId is required.");
        });

        RuleFor(x => x.Items)
            .Must(items => items.Select(i => i.SessionId).Distinct().Count() == items.Count)
            .WithMessage("SessionIds must be distinct.")
            .When(x => x.Items is { Count: > 0 });
    }
}
