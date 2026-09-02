using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.GetMyWallet;
using TutorHub.Application.Features.Wallets.GetWalletStatement;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wallets;

public class WalletQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();

    [Fact]
    public async Task GetMyWallet_IncludesBothPendingAndProcessingInPendingWithdrawals()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            PendingBalance = 1_000_000m,
            AvailableBalance = 500_000m,
            UpdatedAt = DateTime.UtcNow
        };

        var withdrawals = new List<Withdrawal>
        {
            new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 100_000m, Status = WithdrawalStatus.Pending },
            new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 200_000m, Status = WithdrawalStatus.Processing },
            new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 300_000m, Status = WithdrawalStatus.Completed },
            new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 400_000m, Status = WithdrawalStatus.Failed }
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(withdrawals).Object);

        var handler = new GetMyWalletQueryHandler(_contextMock.Object);

        // Act
        var result = await handler.Handle(new GetMyWalletQuery(user.Id), CancellationToken.None);

        // Assert
        result.PendingBalance.Should().Be(1_000_000m);
        result.AvailableBalance.Should().Be(500_000m);
        result.PendingWithdrawal.Should().Be(300_000m); // 100k (Pending) + 200k (Processing)
        result.TotalBalance.Should().Be(1_800_000m);    // 1M + 500k + 300k
    }

    [Fact]
    public async Task GetWalletStatement_ReturnsPagedTransactions()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id
        };

        var transactions = new List<WalletTransaction>
        {
            new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTransactionType.SessionPayoutCredit,
                Amount = 500_000m,
                BalanceAfter = 500_000m,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            },
            new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTransactionType.WithdrawalDebit,
                Amount = 200_000m,
                BalanceAfter = 300_000m,
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            }
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);

        var handler = new GetWalletStatementQueryHandler(_contextMock.Object);

        // Act
        var result = await handler.Handle(new GetWalletStatementQuery(user.Id), CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
    }
}
