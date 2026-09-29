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
        var query = _context.Transactions.AsNoTracking();

        // 1. Search filter (accent-insensitive; trigram GIN on user/subject/ref columns)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            query = query.Where(t =>
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.StudentProfile.User.FullName)!.ToLower(), pattern, @"\") ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.TutorProfile.User.FullName)!.ToLower(), pattern, @"\") ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Booking.Subject.Name)!.ToLower(), pattern, @"\") ||
                (t.PaymentGatewayRef != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.PaymentGatewayRef)!.ToLower(), pattern, @"\")));
        }

        // 2. Status filter
        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
        }

        // 3. Half-Open interval date filtering
        if (request.FromDate.HasValue)
        {
            var fromUtc = DateTime.SpecifyKind(request.FromDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt >= fromUtc);
        }

        if (request.ToDate.HasValue)
        {
            var toUtcExclusive = DateTime.SpecifyKind(request.ToDate.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt < toUtcExclusive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // 4. Deterministic sort & Server-Side Projection
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .ThenBy(t => t.Id)
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
                t.CommissionRate,
                t.CommissionAmount,
                t.PayoutAmount,
                t.PaymentGatewayRef,
                t.Status,
                t.CreatedAt,
                t.ReleasedAt,
                t.RefundedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminTransactionDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
