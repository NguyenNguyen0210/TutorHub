using FluentValidation;

namespace TutorHub.Application.Features.Bookings.CreateBooking;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        When(x => x.ServiceId.HasValue, () =>
        {
            RuleFor(x => x.ServiceId!.Value)
                .NotEmpty().WithMessage("ServiceId is required.");
        });

        When(x => !x.ServiceId.HasValue, () =>
        {
            RuleFor(x => x.TutorProfileId)
                .NotNull().WithMessage("TutorProfileId is required when ServiceId is not provided.")
                .NotEmpty().WithMessage("TutorProfileId is required.");

            RuleFor(x => x.SubjectId)
                .NotNull().WithMessage("SubjectId is required when ServiceId is not provided.")
                .NotEmpty().WithMessage("SubjectId is required.");

            RuleFor(x => x.StartAt)
                .NotNull().WithMessage("StartAt is required.")
                .Must(startAt => startAt.HasValue && startAt.Value > DateTime.UtcNow)
                .WithMessage("Booking start time must be in the future.");

            RuleFor(x => x.EndAt)
                .NotNull().WithMessage("EndAt is required.")
                .Must((cmd, endAt) => endAt.HasValue && cmd.StartAt.HasValue && endAt.Value > cmd.StartAt.Value)
                .WithMessage("Booking end time must be greater than start time.")
                .Must((cmd, endAt) => endAt.HasValue && cmd.StartAt.HasValue && (endAt.Value - cmd.StartAt.Value).TotalMinutes >= 30)
                .WithMessage("Booking duration must be at least 30 minutes.")
                .Must((cmd, endAt) => endAt.HasValue && cmd.StartAt.HasValue && (endAt.Value - cmd.StartAt.Value).TotalHours <= 8)
                .WithMessage("Booking duration cannot exceed 8 hours.");
        });
    }
}
