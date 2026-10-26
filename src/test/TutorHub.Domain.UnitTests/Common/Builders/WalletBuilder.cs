using TutorHub.Domain.Entities;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class WalletBuilder
{
    private static readonly DateTime DefaultUpdatedAt = new(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private Guid _id = Guid.NewGuid();
    private Guid _tutorProfileId = Guid.NewGuid();
    private decimal _pendingBalance = 0m;
    private decimal _availableBalance = 0m;
    private DateTime _updatedAt = DefaultUpdatedAt;

    public WalletBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public WalletBuilder WithTutorProfileId(Guid tutorProfileId)
    {
        _tutorProfileId = tutorProfileId;
        return this;
    }

    public WalletBuilder WithBalances(decimal pending, decimal available)
    {
        _pendingBalance = pending;
        _availableBalance = available;
        return this;
    }

    public WalletBuilder WithUpdatedAt(DateTime updatedAt)
    {
        _updatedAt = updatedAt;
        return this;
    }

    public Wallet Build()
    {
        return new Wallet
        {
            Id = _id,
            TutorProfileId = _tutorProfileId,
            PendingBalance = _pendingBalance,
            AvailableBalance = _availableBalance,
            UpdatedAt = _updatedAt,
            Withdrawals = new List<Withdrawal>()
        };
    }
}
