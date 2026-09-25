using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminFailWithdrawal;

public class AdminFailStudentWithdrawalCommandValidator : AbstractValidator<AdminFailStudentWithdrawalCommand>
{
    public AdminFailStudentWithdrawalCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Failure reason is mandatory.")
            .MaximumLength(500)
            .WithMessage("Failure reason must not exceed 500 characters.");
    }
}
