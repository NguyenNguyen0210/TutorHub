using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Transactions.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Transactions.GetMyTransactions;

public class GetMyTransactionsQueryHandler : IRequestHandler<GetMyTransactionsQuery, PagedResult<UserTransactionDto>>
{
    private readonly IAppDbContext _context;

    public GetMyTransactionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserTransactionDto>> Handle(GetMyTransactionsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Transactions.AsNoTracking();

        // 1. Role-based Identity Filter (Student or Tutor)
        if (request.Role == UserRole.Student)
        {
            query = query.Where(t => t.Booking.StudentProfile.UserId == request.UserId);
        }
        else if (request.Role == UserRole.Tutor)
        {
            query = query.Where(t => t.Booking.TutorProfile.UserId == request.UserId);
        }
        else
        {
            return new PagedResult<UserTransactionDto>(new List<UserTransactionDto>(), 0, request.PageNumber, request.PageSize);
        }

        // 2. Status Filter
        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
        }

        // 3. Half-Open Interval Date Range Filtering
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

        // 4. Deterministic Sort & Server-Side Projection
        var isStudent = request.Role == UserRole.Student;
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .ThenBy(t => t.Id)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new UserTransactionDto(
                t.Id,
                t.BookingId,
                t.Booking.Subject.Name,
                isStudent ? t.Booking.TutorProfile.User.FullName : t.Booking.StudentProfile.User.FullName,
                t.Amount,
                isStudent ? null : (decimal?)t.CommissionAmount,
                isStudent ? null : (decimal?)t.PayoutAmount,
                t.Status,
                t.PaymentGatewayRef,
                t.CreatedAt,
                t.ReleasedAt,
                t.RefundedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserTransactionDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
