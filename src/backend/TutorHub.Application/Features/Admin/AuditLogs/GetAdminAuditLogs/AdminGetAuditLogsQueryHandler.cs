using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.AuditLogs.DTOs;

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
            query = query.Where(a => a.CreatedAt >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= request.DateTo.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var size = request.PageSize <= 0 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
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
