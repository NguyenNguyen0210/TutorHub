using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Transactions.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;

public record GetAdminTransactionsQuery(
    string? Search = null,
    TransactionStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminTransactionDto>>;
