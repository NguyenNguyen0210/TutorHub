using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWithdrawals;

public record GetMyStudentWithdrawalsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResult<StudentWithdrawalDto>>;
