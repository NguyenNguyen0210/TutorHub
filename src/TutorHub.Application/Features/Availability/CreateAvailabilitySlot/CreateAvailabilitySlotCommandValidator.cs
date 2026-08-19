using FluentValidation;

namespace TutorHub.Application.Features.Availability.CreateAvailabilitySlot;

public class CreateAvailabilitySlotCommandValidator : AbstractValidator<CreateAvailabilitySlotCommand>
{
    public CreateAvailabilitySlotCommandValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .IsInEnum().WithMessage("Valid DayOfWeek is required (Sunday to Saturday).");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required.")
            .Must((cmd, endTime) => endTime > cmd.StartTime)
            .WithMessage("End time must be greater than start time.");
    }
}
