using FluentValidation;

namespace TutorHub.Application.Features.Sessions.ScheduleSession;

public class ScheduleSessionCommandValidator : AbstractValidator<ScheduleSessionCommand>
{
    public ScheduleSessionCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("SessionId is required.");

        RuleFor(x => x.StartAt)
            .NotEmpty().WithMessage("StartAt is required.")
            .Must(startAt => startAt.Kind == DateTimeKind.Utc)
            .WithMessage("StartAt must be in UTC format (ISO 8601 with Z).")
            .Must(startAt => startAt > DateTime.UtcNow)
            .WithMessage("Session start time must be in the future.");

        RuleFor(x => x.EndAt)
            .NotEmpty().WithMessage("EndAt is required.")
            .Must(endAt => endAt.Kind == DateTimeKind.Utc)
            .WithMessage("EndAt must be in UTC format (ISO 8601 with Z).")
            .Must((cmd, endAt) => endAt > cmd.StartAt)
            .WithMessage("Session end time must be greater than start time.");
    }
}
