using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.AuditLogs.DTOs;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Search;

namespace TutorHub.Application.Features.Admin.AuditLogs.GetAdminAuditLogs;

public class AdminGetAuditLogsQueryHandler : IRequestHandler<AdminGetAuditLogsQuery, AdminAuditLogListResponseDto>
{
    private readonly IAppDbContext _context;

    public AdminGetAuditLogsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminAuditLogListResponseDto> Handle(AdminGetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AuditLogs
            .AsNoTracking()
            .Include(a => a.User)
            .AsQueryable();

        if (request.LogId.HasValue) query = query.Where(a => a.Id == request.LogId.Value);
        if (!string.IsNullOrWhiteSpace(request.Action)) query = query.Where(a => a.Action == request.Action);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(term)) + "%";
            var isId = Guid.TryParse(term, out var id);
            query = query.Where(a => (isId && (a.Id == id || a.UserId == id))
                || (a.User != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.User.FullName)!.ToLower(), pattern, @"\"))
                || EF.Functions.Like(a.Action.ToLower(), pattern, @"\")
                || EF.Functions.Like(a.EntityName.ToLower(), pattern, @"\")
                || EF.Functions.Like(a.EntityId.ToLower(), pattern, @"\")
                || EF.Functions.Like(a.CorrelationId.ToLower(), pattern, @"\"));
        }
        if (request.DateFrom.HasValue && request.DateTo.HasValue && request.DateFrom.Value.Date > request.DateTo.Value.Date)
            throw new BadRequestException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");

        if (request.UserId.HasValue)
        {
            query = query.Where(a => a.UserId == request.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.EntityName))
        {
            query = query.Where(a => a.EntityName == request.EntityName);
        }

        if (!string.IsNullOrWhiteSpace(request.EntityId))
        {
            query = query.Where(a => a.EntityId == request.EntityId);
        }

        if (!string.IsNullOrWhiteSpace(request.CorrelationId))
        {
            query = query.Where(a => a.CorrelationId == request.CorrelationId);
        }

        if (request.DateFrom.HasValue)
        {
            var fromUtc = DateTime.SpecifyKind(request.DateFrom.Value.Date.AddHours(-7), DateTimeKind.Utc);
            query = query.Where(a => a.CreatedAt >= fromUtc);
        }

        if (request.DateTo.HasValue)
        {
            var toExclusive = DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddHours(-7), DateTimeKind.Utc);
            query = query.Where(a => a.CreatedAt < toExclusive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var size = request.PageSize <= 0 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var ordered = request.OldestFirst ? query.OrderBy(a => a.CreatedAt).ThenBy(a => a.Id)
            : query.OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id);
        var items = await ordered
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        return new AdminAuditLogListResponseDto
        {
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = size,
            Items = items.Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.FullName,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                OldValuesJson = a.OldValuesJson,
                NewValuesJson = a.NewValuesJson,
                CorrelationId = a.CorrelationId,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                CreatedAt = a.CreatedAt
            }).ToList()
        };
    }
}
