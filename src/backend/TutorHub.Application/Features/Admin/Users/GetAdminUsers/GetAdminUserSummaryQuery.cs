using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;
namespace TutorHub.Application.Features.Admin.Users.GetAdminUsers;
public record GetAdminUserSummaryQuery : IRequest<AdminUserCounts>;
public record AdminUserCounts(int Total, int Active, int Suspended, int Banned);
public class GetAdminUserSummaryQueryHandler(IAppDbContext context) : IRequestHandler<GetAdminUserSummaryQuery, AdminUserCounts>
{
    public async Task<AdminUserCounts> Handle(GetAdminUserSummaryQuery request, CancellationToken cancellationToken) =>
        await context.Users.AsNoTracking().GroupBy(u => 1).Select(g => new AdminUserCounts(g.Count(), g.Count(u => u.Status == AccountStatus.Active),
            g.Count(u => u.Status == AccountStatus.Suspended), g.Count(u => u.Status == AccountStatus.Banned))).SingleOrDefaultAsync(cancellationToken) ?? new(0, 0, 0, 0);
}
