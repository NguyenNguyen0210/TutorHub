using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;

public record StudentRequestWithdrawalCommand(
    decimal Amount,
    string BankName,
    string? BankCode,
    string AccountNumber,
    string AccountHolderName,
    string? Note = null
) : IRequest<StudentWithdrawalDto>;
