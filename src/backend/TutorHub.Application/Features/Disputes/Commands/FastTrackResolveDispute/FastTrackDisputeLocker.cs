using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Disputes.Commands.FastTrackResolveDispute;

public sealed class FastTrackDisputeLocker : IFastTrackDisputeLocker
{
    private readonly IAppDbContext _context;

    public FastTrackDisputeLocker(IAppDbContext context)
    {
        _context = context;
    }

    public async Task LockDisputeAsync(Guid disputeId, CancellationToken cancellationToken)
    {
        // Locked via separate SELECT ... FOR UPDATE (FromSql+Include breaks on
        // the Disputes xmin row-version).
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"Disputes\" WHERE \"Id\" = {disputeId} FOR UPDATE",
            cancellationToken);
    }

    public Task<TutorWallet?> LockTutorWalletAsync(Guid tutorProfileId, CancellationToken cancellationToken)
    {
        return _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {tutorProfileId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
    }
}
