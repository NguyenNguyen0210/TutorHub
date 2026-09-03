using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Disputes.CreateDispute;

public class CreateDisputeCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CreateDisputeCommandHandler _handler;

    public CreateDisputeCommandHandlerTests()
    {
        _handler = new CreateDisputeCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_PreReleaseDispute_SetsEscrowHold_DoesNotModifyWalletHeldBalance()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student One" };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor One" };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 1_000_000m
        };
        session.Schedule(DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1));

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 2_000_000m,
            HeldBalance = 0m,
            PendingBalance = 1_000_000m
        };

        var sessions = new List<Session> { session };
        var disputes = new List<Dispute>();
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction>();
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new CreateDisputeCommand(session.Id, studentUser.Id, DisputeReason.QualityIssue, "Session was very short");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.HoldType.Should().Be(FinancialHoldType.EscrowHold);
        result.HoldStatus.Should().Be(FinancialHoldStatus.Active);
        result.HeldAmount.Should().Be(1_000_000m);

        // INV-DISP-006: Wallet HeldBalance must remain 0
        wallet.HeldBalance.Should().Be(0m);
        wallet.AvailableBalance.Should().Be(2_000_000m);
        session.HasAttendanceConflict.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_PostReleaseDispute_WhenWithdrawableBalanceSufficient_AllocatesBalanceHold()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student One" };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor One" };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 1_000_000m
        };
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        session.Complete();

        var originalTx = new Transaction
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            BookingId = enrollment.BookingId,
            Type = TransactionType.SessionPayoutCredit,
            Amount = 1_000_000m,
            CommissionAmount = 100_000m,
            PayoutAmount = 900_000m,
            Status = TransactionStatus.Released
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 1_500_000m,
            HeldBalance = 0m
        };

        var sessions = new List<Session> { session };
        var disputes = new List<Dispute>();
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction> { originalTx };
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new CreateDisputeCommand(session.Id, studentUser.Id, DisputeReason.InappropriateBehavior, "Tutor was unprofessional");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.HoldType.Should().Be(FinancialHoldType.BalanceHold);
        result.HoldStatus.Should().Be(FinancialHoldStatus.Active);
        result.HeldAmount.Should().Be(900_000m);

        // Wallet HeldBalance should be incremented, Withdrawable reduced (DEC-S8-001)
        wallet.HeldBalance.Should().Be(900_000m);
        wallet.AvailableBalance.Should().Be(1_500_000m);
        wallet.WithdrawableBalance.Should().Be(600_000m);
        walletTransactions.Should().ContainSingle(t => t.Type == WalletTransactionType.DisputeHoldReservationDebit && t.Amount == 900_000m);
    }

    [Fact]
    public async Task HoldUsesWithdrawableBalance_NotAvailableBalance()
    {
        // Arrange (P0 test from review: Available = 1m, Held = 800k => Withdrawable = 200k. Required = 500k => NO hold)
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student One" };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor One" };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 555_555m
        };
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        session.Complete();

        var originalTx = new Transaction
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            BookingId = enrollment.BookingId,
            Type = TransactionType.SessionPayoutCredit,
            Amount = 555_555m,
            CommissionAmount = 55_555m,
            PayoutAmount = 500_000m, // RequiredHold = 500k
            Status = TransactionStatus.Released
        };

        // Available is 1m, but Held is 800k => Withdrawable = 200k < 500k
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 1_000_000m,
            HeldBalance = 800_000m
        };

        var sessions = new List<Session> { session };
        var disputes = new List<Dispute>();
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction> { originalTx };
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new CreateDisputeCommand(session.Id, studentUser.Id, DisputeReason.QualityIssue, "Not satisfied");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert: NO hold created, transitions to RequiresAdminFinancialIntervention (DEC-S8-028)
        result.Should().NotBeNull();
        result.HeldAmount.Should().Be(0m);
        result.HoldStatus.Should().Be(FinancialHoldStatus.InsufficientFunds);
        result.Status.Should().Be(DisputeStatus.RequiresAdminFinancialIntervention);

        // HeldBalance must remain strictly 800k (does NOT become 1.3m)
        wallet.HeldBalance.Should().Be(800_000m);
        wallet.AvailableBalance.Should().Be(1_000_000m);
        wallet.WithdrawableBalance.Should().Be(200_000m);
    }

    [Fact]
    public async Task Handle_WhenActiveDisputeAlreadyExists_ThrowsConflictException()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid() };
        var tutorUser = new User { Id = Guid.NewGuid() };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment
        };
        session.Schedule(DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1));

        var existingDispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id
        };

        var sessions = new List<Session> { session };
        var disputes = new List<Dispute> { existingDispute };

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);

        var command = new CreateDisputeCommand(session.Id, studentUser.Id, DisputeReason.Other, "Duplicate");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_WhenUserNotParticipant_ThrowsForbiddenException()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid() };
        var tutorUser = new User { Id = Guid.NewGuid() };
        var randomUser = new User { Id = Guid.NewGuid() };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment
        };
        session.Schedule(DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1));

        var sessions = new List<Session> { session };
        var disputes = new List<Dispute>();

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);

        var command = new CreateDisputeCommand(session.Id, randomUser.Id, DisputeReason.Other, "Intruder");

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => _handler.Handle(command, CancellationToken.None));
    }
}
