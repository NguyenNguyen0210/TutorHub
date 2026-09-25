using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminFailWithdrawal;

public record AdminFailStudentWithdrawalCommand(Guid WithdrawalId, string Reason) : IRequest<StudentWithdrawalDto>;
