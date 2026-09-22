using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Queries.AdminGetStudentWithdrawals;

public record AdminGetStudentWithdrawalsQuery(
    WithdrawalStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<PagedResult<StudentWithdrawalDto>>;
