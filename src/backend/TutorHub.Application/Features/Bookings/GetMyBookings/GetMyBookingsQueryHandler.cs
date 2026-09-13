using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.GetMyBookings;

public class GetMyBookingsQueryHandler : IRequestHandler<GetMyBookingsQuery, PagedResult<BookingSummaryDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyBookingsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<BookingSummaryDto>> Handle(GetMyBookingsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
            .AsQueryable();

        // Filter by user role & ownership. Any other role is rejected:
        // this endpoint is scoped to the caller's own bookings (route locked
        // to Student/Tutor); there is intentionally no unfiltered fall-through.
        if (role == UserRole.Student)
        {
            query = query.Where(b => b.StudentProfile.UserId == userId);
        }
        else if (role == UserRole.Tutor)
        {
            query = query.Where(b => b.TutorProfile.UserId == userId);
        }
        else
        {
            throw new ForbiddenException("Only students and tutors can view bookings through this endpoint.");
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
            .ThenBy(b => b.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            // NOTE: kept inline (not BookingMapper) — this projection is translated
            // to SQL and EF cannot translate static mapper calls. (ResolveReport /
            // GetAdminReportById keep their own null-tolerant variants.)
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
