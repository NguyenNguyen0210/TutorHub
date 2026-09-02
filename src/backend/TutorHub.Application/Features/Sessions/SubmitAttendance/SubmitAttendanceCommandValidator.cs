using FluentValidation;

namespace TutorHub.Application.Features.Sessions.SubmitAttendance;

public class SubmitAttendanceCommandValidator : AbstractValidator<SubmitAttendanceCommand>
{
    public SubmitAttendanceCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("SessionId is required.");

        RuleFor(x => x.Outcome)
            .IsInEnum().WithMessage("Valid AttendanceStatus outcome is required.");
    }
}
