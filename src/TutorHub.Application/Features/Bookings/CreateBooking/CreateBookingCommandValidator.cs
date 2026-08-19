using FluentValidation;

namespace TutorHub.Application.Features.Bookings.CreateBooking;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.TutorProfileId)
            .NotEmpty().WithMessage("TutorProfileId is required.");

        RuleFor(x => x.SubjectId)
            .NotEmpty().WithMessage("SubjectId is required.");

        RuleFor(x => x.StartAt)
            .NotEmpty().WithMessage("StartAt is required.")
            .Must(startAt => startAt > DateTime.UtcNow)
            .WithMessage("Booking start time must be in the future.");

        RuleFor(x => x.EndAt)
            .NotEmpty().WithMessage("EndAt is required.")
            .Must((cmd, endAt) => endAt > cmd.StartAt)
            .WithMessage("Booking end time must be greater than start time.")
            .Must((cmd, endAt) => (endAt - cmd.StartAt).TotalMinutes >= 30)
            .WithMessage("Booking duration must be at least 30 minutes.")
            .Must((cmd, endAt) => (endAt - cmd.StartAt).TotalHours <= 8)
            .WithMessage("Booking duration cannot exceed 8 hours.");
    }
}
