using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminProcessWithdrawal;

public class AdminProcessStudentWithdrawalCommandHandler : IRequestHandler<AdminProcessStudentWithdrawalCommand, StudentWithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AdminProcessStudentWithdrawalCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<StudentWithdrawalDto> Handle(AdminProcessStudentWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();

        var withdrawal = await _context.StudentWithdrawals
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException(nameof(StudentWithdrawal), request.WithdrawalId);
        }

        withdrawal.MarkProcessing(adminId);
        await _context.SaveChangesAsync(cancellationToken);

        return new StudentWithdrawalDto
        {
            Id = withdrawal.Id,
            StudentWalletId = withdrawal.StudentWalletId,
            Amount = withdrawal.Amount,
            Status = withdrawal.Status,
            BankName = withdrawal.BankName,
            BankCode = withdrawal.BankCode,
            AccountNumber = withdrawal.AccountNumber,
            AccountHolderName = withdrawal.AccountHolderName,
            Note = withdrawal.Note,
            RequestedAt = withdrawal.RequestedAt,
            ProcessedAt = withdrawal.ProcessedAt,
            FailureReason = withdrawal.FailureReason
        };
    }
}
