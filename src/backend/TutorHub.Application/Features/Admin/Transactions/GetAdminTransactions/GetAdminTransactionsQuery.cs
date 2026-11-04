using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Transactions.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;

public enum AdminTransactionSort { Newest, Oldest, AmountDesc, AmountAsc }

public record GetAdminTransactionsQuery(
    string? Search = null,
    TransactionStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int PageNumber = 1,
    int PageSize = 10,
    TransactionType? Type = null,
    AdminTransactionSort Sort = AdminTransactionSort.Newest,
    Guid? BookingId = null,
    Guid? TransactionId = null,
    bool? SettlementRequired = null
) : IRequest<PagedResult<AdminTransactionDto>>;
