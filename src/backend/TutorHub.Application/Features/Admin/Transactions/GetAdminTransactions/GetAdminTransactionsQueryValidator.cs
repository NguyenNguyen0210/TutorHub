using FluentValidation;

namespace TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;

public class GetAdminTransactionsQueryValidator : AbstractValidator<GetAdminTransactionsQuery>
{
    public GetAdminTransactionsQueryValidator()
    {
        RuleFor(x => x.Sort).IsInEnum();
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
        RuleFor(x => x.Type).IsInEnum().When(x => x.Type.HasValue);
        RuleFor(x => x.FromDate).Must(date => date == null || date.Value.Year is >= 1900 and <= 9998)
            .WithMessage("Ngày bắt đầu không hợp lệ.");
        RuleFor(x => x.ToDate).Must(date => date == null || date.Value.Year is >= 1900 and <= 9998)
            .WithMessage("Ngày kết thúc không hợp lệ.");
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageNumber must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x)
            .Must(x => !x.FromDate.HasValue || !x.ToDate.HasValue || x.FromDate.Value <= x.ToDate.Value)
            .WithMessage("FromDate must be less than or equal to ToDate.");
    }
}
