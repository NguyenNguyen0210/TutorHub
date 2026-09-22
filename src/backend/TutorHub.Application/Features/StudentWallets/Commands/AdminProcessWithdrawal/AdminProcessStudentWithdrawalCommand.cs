using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminProcessWithdrawal;

public record AdminProcessStudentWithdrawalCommand(Guid WithdrawalId) : IRequest<StudentWithdrawalDto>;
