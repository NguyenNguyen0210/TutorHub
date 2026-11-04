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
                .NotEmpty().MaximumLength(1000).WithMessage("Cần ghi rõ lý do hoàn tiền chưa thành công, tối đa 1.000 ký tự.");
        });
        When(x => x.Outcome == TransactionStatus.Succeeded, () =>
            RuleFor(x => x.ProviderReference).NotEmpty().MaximumLength(200)
                .WithMessage("Cần mã tham chiếu đối soát, tối đa 200 ký tự."));
    }
}
