using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.DTOs;

namespace TutorHub.Application.Features.Reports.GetMyReports;

public class GetMyReportsQueryHandler : IRequestHandler<GetMyReportsQuery, PagedResult<UserReportDetailDto>>
{
    private readonly IAppDbContext _context;

    public GetMyReportsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserReportDetailDto>> Handle(GetMyReportsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Reports
            .AsNoTracking()
            .Where(r => r.ReporterUserId == request.UserId);

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new UserReportDetailDto(
                r.Id,
                r.BookingId,
                r.Description,
                r.EvidenceUrl,
                r.Status,
                r.AdminDecision,
                r.Resolution,
                r.CreatedAt,
                r.ResolvedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserReportDetailDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
