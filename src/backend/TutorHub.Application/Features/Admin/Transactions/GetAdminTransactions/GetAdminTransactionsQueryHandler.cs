using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Application.Features.Admin.Transactions.DTOs;

namespace TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;

public class GetAdminTransactionsQueryHandler : IRequestHandler<GetAdminTransactionsQuery, PagedResult<AdminTransactionDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminTransactionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminTransactionDto>> Handle(GetAdminTransactionsQuery request, CancellationToken cancellationToken)
    {
        // An archived service must not hide its financial ledger from administrators.
        var query = _context.Transactions.IgnoreQueryFilters().AsNoTracking();
        if (request.Type.HasValue) query = query.Where(t => t.Type == request.Type);
        if (request.BookingId.HasValue) query = query.Where(t => t.BookingId == request.BookingId);
        if (request.TransactionId.HasValue) query = query.Where(t => t.Id == request.TransactionId);

        // 1. Search filter (accent-insensitive; trigram GIN on user/subject/ref columns)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            var exactId = Guid.TryParse(request.Search.Trim(), out var parsedId) ? parsedId : Guid.Empty;
            query = query.Where(t =>
                t.Id == exactId || t.BookingId == exactId ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.StudentProfile.User.FullName)!.ToLower(), pattern, @"\") ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.TutorProfile.User.FullName)!.ToLower(), pattern, @"\") ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.Subject.Name)!.ToLower(), pattern, @"\") ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.Service.Title)!.ToLower(), pattern, @"\") ||
                (t.PaymentGatewayRef != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.PaymentGatewayRef)!.ToLower(), pattern, @"\")));
        }

        // 2. Status filter
        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
        }

        // Inclusive calendar dates in Vietnam, represented as a half-open UTC interval.
        if (request.FromDate.HasValue)
        {
            var fromUtc = DateTime.SpecifyKind(request.FromDate.Value.Date.AddHours(-7), DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt >= fromUtc);
        }

        if (request.ToDate.HasValue)
        {
            var toUtcExclusive = DateTime.SpecifyKind(request.ToDate.Value.Date.AddDays(1).AddHours(-7), DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt < toUtcExclusive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // 4. Deterministic sort & Server-Side Projection
        var ordered = request.Sort switch
        {
            AdminTransactionSort.Oldest => query.OrderBy(t => t.CreatedAt).ThenBy(t => t.Id),
            AdminTransactionSort.AmountAsc => query.OrderBy(t => t.Amount).ThenByDescending(t => t.CreatedAt).ThenBy(t => t.Id),
            AdminTransactionSort.AmountDesc => query.OrderByDescending(t => t.Amount).ThenByDescending(t => t.CreatedAt).ThenBy(t => t.Id),
            _ => query.OrderByDescending(t => t.CreatedAt).ThenBy(t => t.Id)
        };
        var items = await ordered
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new AdminTransactionDto(
                t.Id,
                t.BookingId,
                t.Booking.StudentProfile.UserId,
                t.Booking.StudentProfile.User.FullName,
                t.Booking.StudentProfile.User.Email,
                t.Booking.TutorProfile.UserId,
                t.Booking.TutorProfile.User.FullName,
                t.Booking.TutorProfile.User.Email,
                t.Booking.Subject.Name,
                t.Amount,
                t.PlatformFeeRate,
                t.PlatformFeeAmount,
                t.PayoutAmount,
                t.PaymentGatewayRef,
                t.Status,
                t.CreatedAt,
                t.ReleasedAt,
                t.RefundedAt,
                t.Type,
                t.SessionId,
                t.DisputeId,
                t.Booking.Enrollment != null ? t.Booking.Enrollment.Id : (Guid?)null,
                t.Booking.Service.Title,
                t.Session != null ? t.Session.SessionNumber : (int?)null,
                t.Booking.ConfirmedAt,
                t.RelatedTransactionId,
                t.Description,
                t.SettlementRequired
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminTransactionDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
