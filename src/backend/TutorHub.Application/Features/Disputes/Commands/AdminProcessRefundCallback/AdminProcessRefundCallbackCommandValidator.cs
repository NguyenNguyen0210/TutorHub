using FluentValidation;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback;

public class AdminProcessRefundCallbackCommandValidator : AbstractValidator<AdminProcessRefundCallbackCommand>
{
    public AdminProcessRefundCallbackCommandValidator()
    {
        RuleFor(x => x.RefundTransactionId).NotEmpty();

        RuleFor(x => x.Outcome)
            .Must(o => o == TransactionStatus.Succeeded || o == TransactionStatus.Failed)
            .WithMessage("Refund callback outcome must be either Succeeded or Failed.");

        When(x => x.Outcome == TransactionStatus.Failed, () =>
        {
            RuleFor(x => x.FailureReason)
                .NotEmpty().WithMessage("Failure reason is required when refund fails.");
        });
    }
}
