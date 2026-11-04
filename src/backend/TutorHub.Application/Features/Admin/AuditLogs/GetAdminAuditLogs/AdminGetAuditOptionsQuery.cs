using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
namespace TutorHub.Application.Features.Admin.AuditLogs.GetAdminAuditLogs;
public record AdminGetAuditOptionsQuery : IRequest<AdminAuditOptionsDto>;
public record AdminAuditOptionsDto(IReadOnlyList<string> Entities, IReadOnlyList<string> Actions);
public class AdminGetAuditOptionsQueryHandler(IAppDbContext context) : IRequestHandler<AdminGetAuditOptionsQuery, AdminAuditOptionsDto>
{
    public async Task<AdminAuditOptionsDto> Handle(AdminGetAuditOptionsQuery request, CancellationToken cancellationToken)
    {
        var entities = await context.AuditLogs.AsNoTracking().Where(a => a.EntityName != "").Select(a => a.EntityName).Distinct().OrderBy(value => value).ToListAsync(cancellationToken);
        var actions = await context.AuditLogs.AsNoTracking().Where(a => a.Action != "").Select(a => a.Action).Distinct().OrderBy(value => value).ToListAsync(cancellationToken);
        return new(entities, actions);
    }
}
