using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Reports.GetAdminReports;

public class GetAdminReportsQueryHandler : IRequestHandler<GetAdminReportsQuery, PagedResult<ReportSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminReportsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ReportSummaryDto>> Handle(GetAdminReportsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Reports
            .AsNoTracking()
            .Include(r => r.ReporterUser)
            .Include(r => r.Booking).ThenInclude(b => b.StudentProfile)
            .Include(r => r.Booking).ThenInclude(b => b.TutorProfile)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReportSummaryDto(
                r.Id,
                r.BookingId,
                r.ReporterUserId,
                r.ReporterUser.FullName,
                r.ReporterUserId == r.Booking.StudentProfile.UserId ? "Student" : "Tutor",
                r.Description,
                r.EvidenceUrl,
                r.Status,
                r.AdminDecision,
                r.CreatedAt,
                r.ResolvedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<ReportSummaryDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
