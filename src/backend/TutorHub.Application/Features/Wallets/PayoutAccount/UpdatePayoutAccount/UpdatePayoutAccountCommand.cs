using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.UpdatePayoutAccount;

public record UpdatePayoutAccountCommand(
    Guid UserId,
    string BankName,
    string? BankCode,
    string AccountNumber,
    string AccountHolderName
) : IRequest<TutorPayoutAccountDto>;

public class UpdatePayoutAccountCommandValidator : AbstractValidator<UpdatePayoutAccountCommand>
{
    public UpdatePayoutAccountCommandValidator()
    {
        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("Bank name is required.")
            .MaximumLength(100).WithMessage("Bank name cannot exceed 100 characters.");

        RuleFor(x => x.BankCode)
            .MaximumLength(20).WithMessage("Bank code cannot exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.BankCode));

        RuleFor(x => x.AccountNumber)
            .NotEmpty().WithMessage("Account number is required.")
            .MaximumLength(50).WithMessage("Account number cannot exceed 50 characters.");

        RuleFor(x => x.AccountHolderName)
            .NotEmpty().WithMessage("Account holder name is required.")
            .MaximumLength(150).WithMessage("Account holder name cannot exceed 150 characters.");
    }
}

public class UpdatePayoutAccountCommandHandler : IRequestHandler<UpdatePayoutAccountCommand, TutorPayoutAccountDto>
{
    private readonly IAppDbContext _context;

    public UpdatePayoutAccountCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorPayoutAccountDto> Handle(UpdatePayoutAccountCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors can update payout destination details.");
        }

        tutor.SetPayoutAccount(
            bankName: request.BankName,
            accountNumber: request.AccountNumber,
            accountHolderName: request.AccountHolderName,
            bankCode: request.BankCode
        );

        await _context.SaveChangesAsync(cancellationToken);

        return new TutorPayoutAccountDto(
            BankName: tutor.BankName,
            BankCode: tutor.BankCode,
            AccountNumber: tutor.AccountNumber,
            AccountHolderName: tutor.AccountHolderName
        );
    }
}
