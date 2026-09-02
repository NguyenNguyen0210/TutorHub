using FluentAssertions;
using MediatR;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawalById;
using TutorHub.Application.Features.Admin.Withdrawals.ProcessWithdrawal;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Withdrawals;

public class AdminWithdrawalCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPublisher> _publisherMock = new();

    private static (Withdrawal withdrawal, Wallet wallet, User adminUser) CreateTestAggregate(WithdrawalStatus initialStatus = WithdrawalStatus.Pending)
    {
        var adminUser = new UserBuilder().WithRole(UserRole.Admin).Build();
        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            AvailableBalance = 500_000m,
            PendingBalance = 0m,
            UpdatedAt = DateTime.UtcNow
        };

        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Wallet = wallet,
            Amount = 300_000m,
            Status = initialStatus,
            BankName = "Vietcombank",
            BankCode = "VCB",
            AccountNumber = "0123456789",
            AccountHolderName = "NGUYEN VAN A",
            RequestedAt = DateTime.UtcNow.AddHours(-1)
        };

        return (withdrawal, wallet, adminUser);
    }

    [Fact]
    public async Task ProcessWithdrawal_FromPending_TransitionsToProcessing()
    {
        // Arrange
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Pending);

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);

        var handler = new ProcessWithdrawalCommandHandler(_contextMock.Object);
        var command = new ProcessWithdrawalCommand(withdrawal.Id, admin.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(WithdrawalStatus.Processing);
        result.ProcessingStartedByAdminId.Should().Be(admin.Id);
    }

    [Fact]
    public async Task ProcessWithdrawal_FromNonPending_ThrowsConflictException()
    {
        // Arrange
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Processing);

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);

        var handler = new ProcessWithdrawalCommandHandler(_contextMock.Object);
        var command = new ProcessWithdrawalCommand(withdrawal.Id, admin.Id);

        // Act
        var act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Must be in Pending status*");
    }

    [Fact]
    public async Task CompleteWithdrawal_FromProcessing_TransitionsToCompleted_AndPublishesEvent()
    {
        // Arrange
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Processing);

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);

        var handler = new CompleteWithdrawalCommandHandler(_contextMock.Object, _publisherMock.Object);
        var command = new CompleteWithdrawalCommand(withdrawal.Id, admin.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(WithdrawalStatus.Completed);
        result.ProcessedByAdminId.Should().Be(admin.Id);
        result.ProcessedAt.Should().NotBeNull();

        _publisherMock.Verify(
            p => p.Publish(It.Is<WithdrawalCompletedEvent>(e => e.WithdrawalId == withdrawal.Id && e.Amount.Amount == 300_000m), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task CompleteWithdrawal_FromPending_ThrowsConflictException()
    {
        // Arrange (Strict State Machine Guard - DEC-WD-003, INV-WD-004)
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Pending);

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);

        var handler = new CompleteWithdrawalCommandHandler(_contextMock.Object, _publisherMock.Object);
        var command = new CompleteWithdrawalCommand(withdrawal.Id, admin.Id);

        // Act
        var act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Must be in Processing status*");
    }

    [Fact]
    public async Task FailWithdrawal_FromProcessing_RestoresAvailableBalance_RecordsAdjustment_AndPublishesEvent()
    {
        // Arrange
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Processing);
        var ledgerEntries = new List<WalletTransaction>();

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(ledgerEntries).Object);

        var handler = new FailWithdrawalCommandHandler(_contextMock.Object, _publisherMock.Object);
        var command = new FailWithdrawalCommand(withdrawal.Id, admin.Id, "Bank rejected: Account number does not match name");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(WithdrawalStatus.Failed);
        result.FailureReason.Should().Be("Bank rejected: Account number does not match name");
        result.ProcessedByAdminId.Should().Be(admin.Id);

        // AvailableBalance is restored atomically (500k + 300k = 800k)
        wallet.AvailableBalance.Should().Be(800_000m);

        // Immutable ledger record created
        ledgerEntries.Should().HaveCount(1);
        ledgerEntries[0].Type.Should().Be(WalletTransactionType.WithdrawalFailedAdjustmentCredit);
        ledgerEntries[0].Amount.Should().Be(300_000m);
        ledgerEntries[0].BalanceAfter.Should().Be(800_000m);

        _publisherMock.Verify(
            p => p.Publish(It.Is<WithdrawalFailedEvent>(e => e.WithdrawalId == withdrawal.Id && e.Amount.Amount == 300_000m), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task FailWithdrawal_FromPending_ThrowsConflictException()
    {
        // Arrange (Strict State Machine Guard - DEC-WD-003, INV-WD-004)
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Pending);

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);

        var handler = new FailWithdrawalCommandHandler(_contextMock.Object, _publisherMock.Object);
        var command = new FailWithdrawalCommand(withdrawal.Id, admin.Id, "Reason");

        // Act
        var act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Must be in Processing status*");
    }

    [Fact]
    public async Task GetAdminWithdrawalById_ExistingId_ReturnsDto()
    {
        // Arrange
        var (withdrawal, wallet, admin) = CreateTestAggregate(WithdrawalStatus.Pending);

        _contextMock.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> { withdrawal }).Object);

        var handler = new GetAdminWithdrawalByIdQueryHandler(_contextMock.Object);

        // Act
        var result = await handler.Handle(new GetAdminWithdrawalByIdQuery(withdrawal.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(withdrawal.Id);
        result.Amount.Should().Be(300_000m);
    }
}
