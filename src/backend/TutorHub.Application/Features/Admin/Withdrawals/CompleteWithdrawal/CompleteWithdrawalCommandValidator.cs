using FluentValidation;

namespace TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;

public class CompleteWithdrawalCommandValidator : AbstractValidator<CompleteWithdrawalCommand>
{
    public CompleteWithdrawalCommandValidator()
    {
        RuleFor(x => x.BankTransferReference).Must(reference => reference != null && reference.Trim().Length >= 4)
            .MaximumLength(128).When(x => x.BankTransferReference != null)
            .WithMessage("Mã chuyển khoản phải từ 4 đến 128 ký tự.");
        RuleFor(x => x.ReconciliationNote).MaximumLength(500);
    }
}
