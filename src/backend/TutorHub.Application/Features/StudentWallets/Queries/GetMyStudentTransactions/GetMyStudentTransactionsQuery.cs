using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentTransactions;

public record GetMyStudentTransactionsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResult<StudentWalletTransactionDto>>;
