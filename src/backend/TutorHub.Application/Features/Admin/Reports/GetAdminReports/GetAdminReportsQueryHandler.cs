using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Enums;
using TutorHub.Application.Common.Search;

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
            .Include(r => r.Booking).ThenInclude(b => b!.StudentProfile)
            .Include(r => r.Booking).ThenInclude(b => b!.TutorProfile)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        if (request.ReportType.HasValue) query = query.Where(r => r.ReportType == request.ReportType.Value);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(term)) + "%";
            var isId = Guid.TryParse(term, out var id);
            query = query.Where(r => (isId && r.Id == id)
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(r.ReporterUser.FullName)!.ToLower(), pattern, @"\")
                || (r.ReportedUser != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(r.ReportedUser.FullName)!.ToLower(), pattern, @"\")));
        }
        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber;
        var pageSize = request.PageSize;

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .ThenBy(r => r.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReportSummaryDto(
                r.Id,
                r.BookingId,
                r.ReportType,
                r.ReportedUserId,
                r.TargetId,
                r.ReporterUserId,
                r.ReporterUser.FullName,
                r.Booking != null
                    ? (r.ReporterUserId == r.Booking.StudentProfile.UserId ? "Student" : "Tutor")
                    : r.ReporterUser.Role.ToString(),
                r.Description,
                r.EvidenceUrl,
                r.Status,
                r.AdminDecision,
                r.CreatedAt,
                r.ResolvedAt,
                r.ReportedUser != null ? r.ReportedUser.FullName : null
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
