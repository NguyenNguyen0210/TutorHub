using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminCompleteWithdrawal;

public record AdminCompleteStudentWithdrawalCommand(Guid WithdrawalId) : IRequest<StudentWithdrawalDto>;
