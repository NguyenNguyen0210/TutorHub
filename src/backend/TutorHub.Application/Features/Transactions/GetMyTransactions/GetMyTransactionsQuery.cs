using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Transactions.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Transactions.GetMyTransactions;

public record GetMyTransactionsQuery(
    TransactionStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int PageNumber = 1,
    int PageSize = 10,
    TransactionType? Type = null
) : IRequest<PagedResult<UserTransactionDto>>;
