using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;

public record AdminAdjustStudentWalletCommand(
    Guid StudentWalletId,
    decimal Amount,
    FinancialDirection Direction,
    string Reason,
    Guid? ReferenceId = null
) : IRequest<StudentWalletDto>;
