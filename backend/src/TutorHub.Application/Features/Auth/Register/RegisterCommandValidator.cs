using FluentValidation;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters long.")
            .MaximumLength(100);

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Valid role is required.")
            .Must(r => r == UserRole.Student || r == UserRole.Tutor)
            .WithMessage("Only Student and Tutor roles can register directly.");
    }
}
