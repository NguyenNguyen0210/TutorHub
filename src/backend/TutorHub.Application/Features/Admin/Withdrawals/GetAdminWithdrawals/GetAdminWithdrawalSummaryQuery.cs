using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawals;

public record AdminWithdrawalSummaryDto(int PendingCount, int ProcessingCount, int TotalCount);
public record GetAdminWithdrawalSummaryQuery : IRequest<AdminWithdrawalSummaryDto>;

public class GetAdminWithdrawalSummaryQueryHandler(IAppDbContext context) : IRequestHandler<GetAdminWithdrawalSummaryQuery, AdminWithdrawalSummaryDto>
{
    public async Task<AdminWithdrawalSummaryDto> Handle(GetAdminWithdrawalSummaryQuery request, CancellationToken cancellationToken)
    {
        return await context.Withdrawals.AsNoTracking().Where(w => w.Wallet.User.Role == UserRole.Tutor)
            .GroupBy(w => 1).Select(group => new AdminWithdrawalSummaryDto(
                group.Count(w => w.Status == WithdrawalStatus.Pending),
                group.Count(w => w.Status == WithdrawalStatus.Processing), group.Count()))
            .SingleOrDefaultAsync(cancellationToken) ?? new(0, 0, 0);
    }
}
