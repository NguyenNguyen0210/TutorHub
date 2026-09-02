using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.GetMyBookings;

public class GetMyBookingsQueryHandler : IRequestHandler<GetMyBookingsQuery, PagedResult<BookingSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetMyBookingsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<BookingSummaryDto>> Handle(GetMyBookingsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
            .AsQueryable();

        // Filter by user role & ownership
        if (request.Role == UserRole.Student)
        {
            query = query.Where(b => b.StudentProfile.UserId == request.UserId);
        }
        else if (request.Role == UserRole.Tutor)
        {
            query = query.Where(b => b.TutorProfile.UserId == request.UserId);
        }

        // Filter by status
        if (request.Status.HasValue)
        {
            query = query.Where(b => b.Status == request.Status.Value);
        }

        // Filter by date range (created date)
        if (request.FromDate.HasValue)
        {
            var fromUtc = request.FromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(b => b.CreatedAt >= fromUtc);
        }

        if (request.ToDate.HasValue)
        {
            var toUtc = request.ToDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.CreatedAt <= toUtc);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingSummaryDto(
                b.Id,
                b.StudentProfileId,
                b.StudentProfile.User.FullName,
                b.TutorProfileId,
                b.TutorProfile.User.FullName,
                b.SubjectId,
                b.Subject.Name,
                b.ServiceId,
                b.TotalPrice,
                b.TotalSessions,
                b.Status,
                b.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<BookingSummaryDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
