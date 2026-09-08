using FluentValidation;

namespace TutorHub.Application.Features.Disputes.Commands.FastTrackResolveDispute;

public class FastTrackResolveDisputeCommandValidator : AbstractValidator<FastTrackResolveDisputeCommand>
{
    public FastTrackResolveDisputeCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
        RuleFor(x => x.AdminUserId).NotEmpty();
        RuleFor(x => x.AdminNotes)
            .NotEmpty().WithMessage("Admin notes are required for fast-track resolution.")
            .MaximumLength(2000).WithMessage("Admin notes cannot exceed 2000 characters.");
    }
}
