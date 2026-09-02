using FluentAssertions;
using MediatR;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.CreateWithdrawal;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wallets.CreateWithdrawal;

public class CreateWithdrawalCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPublisher> _publisherMock = new();
    private readonly CreateWithdrawalCommandHandler _handler;

    public CreateWithdrawalCommandHandlerTests()
    {
        _handler = new CreateWithdrawalCommandHandler(_contextMock.Object, _publisherMock.Object);
    }

    [Fact]
    public async Task Handle_WithCustomBankDetails_DeductsAvailableBalance_RecordsLedger_AndPublishesEvent()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        user.Status = AccountStatus.Active;

        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            AvailableBalance = 1_000_000m,
            PendingBalance = 500_000m,
            UpdatedAt = DateTime.UtcNow
        };

        var tutors = new List<TutorProfile> { tutor };
        var wallets = new List<Wallet> { wallet };
        var withdrawals = new List<Withdrawal>();
        var transactions = new List<WalletTransaction>();

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(tutors).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(withdrawals).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);

        var command = new CreateWithdrawalCommand(
            UserId: user.Id,
            Amount: 300_000m,
            BankName: "Vietcombank",
            BankCode: "VCB",
            AccountNumber: "0123456789",
            AccountHolderName: "NGUYEN VAN A",
            Note: "Monthly payout"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Amount.Should().Be(300_000m);
        result.Status.Should().Be(WithdrawalStatus.Pending);
        result.BankName.Should().Be("Vietcombank");
        result.BankCode.Should().Be("VCB");
        result.AccountNumber.Should().Be("0123456789");
        result.AccountHolderName.Should().Be("NGUYEN VAN A");

        wallet.AvailableBalance.Should().Be(700_000m);
        withdrawals.Should().HaveCount(1);
        transactions.Should().HaveCount(1);
        transactions[0].Type.Should().Be(WalletTransactionType.WithdrawalDebit);
        transactions[0].Amount.Should().Be(300_000m);
        transactions[0].BalanceAfter.Should().Be(700_000m);

        _publisherMock.Verify(
            p => p.Publish(It.Is<WithdrawalRequestedEvent>(e => e.Amount == 300_000m && e.TutorUserId == user.Id), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_WithSavedProfileFallback_UsesSavedDetails()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        user.Status = AccountStatus.Active;

        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            BankName = "Techcombank",
            BankCode = "TCB",
            AccountNumber = "9876543210",
            AccountHolderName = "TRAN THI B"
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            AvailableBalance = 500_000m,
            UpdatedAt = DateTime.UtcNow
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal>()).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(new List<WalletTransaction>()).Object);

        var command = new CreateWithdrawalCommand(
            UserId: user.Id,
            Amount: 200_000m
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.BankName.Should().Be("Techcombank");
        result.BankCode.Should().Be("TCB");
        result.AccountNumber.Should().Be("9876543210");
        result.AccountHolderName.Should().Be("TRAN THI B");
        wallet.AvailableBalance.Should().Be(300_000m);
    }

    [Fact]
    public async Task Handle_WhenAmountExceedsAvailableBalance_ThrowsBadRequestException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        user.Status = AccountStatus.Active;

        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            BankName = "VCB",
            AccountNumber = "123",
            AccountHolderName = "NAME"
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            AvailableBalance = 100_000m
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);

        var command = new CreateWithdrawalCommand(
            UserId: user.Id,
            Amount: 200_000m
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().ContainMatch("*Insufficient available balance*");
    }

    [Theory]
    [InlineData(AccountStatus.Suspended)]
    [InlineData(AccountStatus.Banned)]
    public async Task Handle_WhenTutorNotActive_ThrowsForbiddenException(AccountStatus status)
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        user.Status = status;

        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);

        var command = new CreateWithdrawalCommand(
            UserId: user.Id,
            Amount: 100_000m,
            BankName: "VCB",
            AccountNumber: "123",
            AccountHolderName: "NAME"
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().ContainMatch($"*Cannot request withdrawal while account is '{status}'*");
    }

    [Fact]
    public async Task Handle_WhenNoSavedBankAndNoRequestBank_ThrowsBadRequestException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        user.Status = AccountStatus.Active;

        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            BankName = null,
            AccountNumber = null
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);

        var command = new CreateWithdrawalCommand(
            UserId: user.Id,
            Amount: 100_000m
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().ContainMatch("*No saved payout bank account found*");
    }
}
