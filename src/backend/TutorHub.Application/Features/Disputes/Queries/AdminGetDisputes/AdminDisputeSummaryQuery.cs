using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;
namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputes;
public record AdminDisputeSummaryQuery : IRequest<AdminDisputeSummaryDto>;
public record AdminDisputeSummaryDto(int Total, int Open, int UnderReview, int Intervention);
public class AdminDisputeSummaryQueryHandler(IAppDbContext context) : IRequestHandler<AdminDisputeSummaryQuery, AdminDisputeSummaryDto>
{
    public async Task<AdminDisputeSummaryDto> Handle(AdminDisputeSummaryQuery request, CancellationToken cancellationToken) =>
        await context.Disputes.AsNoTracking().GroupBy(d => 1).Select(g => new AdminDisputeSummaryDto(g.Count(),
            g.Count(d => d.Status == DisputeStatus.Open), g.Count(d => d.Status == DisputeStatus.UnderReview),
            g.Count(d => d.Status == DisputeStatus.RequiresAdminFinancialIntervention))).SingleOrDefaultAsync(cancellationToken) ?? new(0, 0, 0, 0);
}
