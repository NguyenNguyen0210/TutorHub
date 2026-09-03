using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Disputes.AdminResolveDispute;

public class AdminResolveDisputeCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly AdminResolveDisputeCommandHandler _handler;

    public AdminResolveDisputeCommandHandlerTests()
    {
        _handler = new AdminResolveDisputeCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task PostReleaseFullRefund_ReconcilesExactly()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student One" };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor One" };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
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

        // Original earning transaction: Gross 1,000,000; Fee 100,000 (10%); Net 900,000
        var originalTx = new Transaction
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            BookingId = enrollment.BookingId,
            Type = TransactionType.SessionPayoutCredit,
            Amount = 1_000_000m,
            CommissionRate = 0.10m,
            CommissionAmount = 100_000m,
            PayoutAmount = 900_000m,
            Status = TransactionStatus.Released
        };

        // Tutor wallet has available balance with 900k held
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 2_000_000m,
            HeldBalance = 900_000m
        };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            Session = session,
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };
        dispute.SetFinancialHold(900_000m, FinancialHoldType.BalanceHold, FinancialHoldStatus.Active, DateTime.UtcNow);
        dispute.MoveUnderReview(adminId, DateTime.UtcNow);

        var disputes = new List<Dispute> { dispute };
        var sessions = new List<Session> { session };
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction> { originalTx };
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminResolveDisputeCommand(
            dispute.Id,
            adminId,
            DisputeResolutionDecision.StudentWinsFullRefund,
            null,
            "Tutor completely failed to deliver session.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(DisputeStatus.Resolved);
        result.ResolutionDecision.Should().Be(DisputeResolutionDecision.StudentWinsFullRefund);

        // Wallet balance assertions
        // Tutor should be debited exactly 900k (their net payout) and held balance unheld
        wallet.AvailableBalance.Should().Be(1_100_000m); // 2,000,000 - 900,000
        wallet.HeldBalance.Should().Be(0m); // 900,000 unheld
        wallet.WithdrawableBalance.Should().Be(1_100_000m);

        // Transaction assertions (DEC-S8-025, DEC-S8-030, DEC-S8-032, DEC-S8-035)
        var studentRefundTx = transactions.FirstOrDefault(t => t.Type == TransactionType.StudentRefund);
        var platformFeeReversalTx = transactions.FirstOrDefault(t => t.Type == TransactionType.PlatformFeeReversal);

        studentRefundTx.Should().NotBeNull();
        studentRefundTx!.Amount.Should().Be(1_000_000m); // Gross refunded to student
        studentRefundTx.Status.Should().Be(TransactionStatus.Pending); // DEC-S8-032

        platformFeeReversalTx.Should().NotBeNull();
        platformFeeReversalTx!.CommissionAmount.Should().Be(100_000m); // Fee returned
        platformFeeReversalTx.Status.Should().Be(TransactionStatus.Succeeded); // DEC-S8-035

        // INV-DISP-007: Exact reconciliation: StudentRefund == TutorNetRecovery + PlatformFeeReversal
        var tutorNetRecovery = 900_000m;
        var feeReversal = platformFeeReversalTx.CommissionAmount;
        (tutorNetRecovery + feeReversal).Should().Be(studentRefundTx.Amount);

        // Original transaction must remain strictly immutable (DEC-S8-030)
        originalTx.Status.Should().Be(TransactionStatus.Released);
        originalTx.Amount.Should().Be(1_000_000m);
        originalTx.CommissionAmount.Should().Be(100_000m);
        originalTx.PayoutAmount.Should().Be(900_000m);
    }

    [Fact]
    public async Task PostReleasePartialRefund_ReconcilesExactly()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student One" };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor One" };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
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
            CommissionRate = 0.10m,
            CommissionAmount = 100_000m,
            PayoutAmount = 900_000m,
            Status = TransactionStatus.Released
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 2_000_000m,
            HeldBalance = 900_000m
        };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            Session = session,
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };
        dispute.SetFinancialHold(900_000m, FinancialHoldType.BalanceHold, FinancialHoldStatus.Active, DateTime.UtcNow);
        dispute.MoveUnderReview(adminId, DateTime.UtcNow);

        var disputes = new List<Dispute> { dispute };
        var sessions = new List<Session> { session };
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction> { originalTx };
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        // Partial refund of 400,000 VND
        var command = new AdminResolveDisputeCommand(
            dispute.Id,
            adminId,
            DisputeResolutionDecision.StudentWinsPartialRefund,
            400_000m,
            "Partial refund: tutor arrived 30 mins late.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(DisputeStatus.Resolved);

        // Expected calculations per DEC-S8-025 Mandatory Patch B:
        // TutorFinalGross = 1,000,000 - 400,000 = 600,000
        // PlatformFinalFee = Round(600,000 * 0.10) = 60,000
        // TutorFinalNet = 600,000 - 60,000 = 540,000
        // TutorNetRecovery = 900,000 - 540,000 = 360,000
        // PlatformFeeReversal = 100,000 - 60,000 = 40,000
        // Reconcile: 360,000 + 40,000 == 400,000
        wallet.AvailableBalance.Should().Be(1_640_000m); // 2,000,000 - 360,000
        wallet.HeldBalance.Should().Be(0m); // fully unheld
        wallet.WithdrawableBalance.Should().Be(1_640_000m);

        var studentRefundTx = transactions.FirstOrDefault(t => t.Type == TransactionType.StudentRefund);
        var platformFeeReversalTx = transactions.FirstOrDefault(t => t.Type == TransactionType.PlatformFeeReversal);

        studentRefundTx.Should().NotBeNull();
        studentRefundTx!.Amount.Should().Be(400_000m);
        studentRefundTx.Status.Should().Be(TransactionStatus.Pending);

        platformFeeReversalTx.Should().NotBeNull();
        platformFeeReversalTx!.CommissionAmount.Should().Be(40_000m);
        platformFeeReversalTx.Status.Should().Be(TransactionStatus.Succeeded);

        // INV-DISP-007 check
        var recovery = 360_000m;
        var reversal = platformFeeReversalTx.CommissionAmount;
        (recovery + reversal).Should().Be(400_000m);

        // Traceability (DEC-S8-030)
        studentRefundTx.RelatedTransactionId.Should().Be(originalTx.Id);
        studentRefundTx.DisputeId.Should().Be(dispute.Id);
        platformFeeReversalTx.RelatedTransactionId.Should().Be(originalTx.Id);
        platformFeeReversalTx.DisputeId.Should().Be(dispute.Id);
    }

    [Fact]
    public async Task PostReleaseRefund_ReversesOnlyApplicablePlatformFee()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var studentUser = new User { Id = Guid.NewGuid() };
        var tutorUser = new User { Id = Guid.NewGuid() };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
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
            EarningAmount = 2_000_000m
        };
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        session.Complete();

        // 15% platform fee: Gross 2m, Fee 300k, Net 1.7m
        var originalTx = new Transaction
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            BookingId = enrollment.BookingId,
            Type = TransactionType.SessionPayoutCredit,
            Amount = 2_000_000m,
            CommissionRate = 0.15m,
            CommissionAmount = 300_000m,
            PayoutAmount = 1_700_000m,
            Status = TransactionStatus.Released
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 2_000_000m,
            HeldBalance = 1_700_000m
        };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            Session = session,
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };
        dispute.SetFinancialHold(1_700_000m, FinancialHoldType.BalanceHold, FinancialHoldStatus.Active, DateTime.UtcNow);
        dispute.MoveUnderReview(adminId, DateTime.UtcNow);

        var disputes = new List<Dispute> { dispute };
        var sessions = new List<Session> { session };
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction> { originalTx };
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        // Refund 500,000 VND
        // Final Gross = 1,500,000
        // Final Fee = 1,500,000 * 0.15 = 225,000
        // Fee Reversal = 300,000 - 225,000 = 75,000
        var command = new AdminResolveDisputeCommand(
            dispute.Id,
            adminId,
            DisputeResolutionDecision.StudentWinsPartialRefund,
            500_000m,
            "Partial refund 500k");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        var platformFeeReversalTx = transactions.FirstOrDefault(t => t.Type == TransactionType.PlatformFeeReversal);
        platformFeeReversalTx.Should().NotBeNull();
        platformFeeReversalTx!.CommissionAmount.Should().Be(75_000m); // Exact reversal
    }

    [Fact]
    public async Task PreReleaseFullRefund_ReleasesFromPendingEscrow_DoesNotDebitTutorAvailableBalance()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var studentUser = new User { Id = Guid.NewGuid() };
        var tutorUser = new User { Id = Guid.NewGuid() };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
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
        // Session NOT completed, payout NOT released

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            AvailableBalance = 500_000m, // unrelated balance
            PendingBalance = 1_000_000m
        };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            Session = session,
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };
        dispute.SetFinancialHold(1_000_000m, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, DateTime.UtcNow);
        dispute.MoveUnderReview(adminId, DateTime.UtcNow);

        var disputes = new List<Dispute> { dispute };
        var sessions = new List<Session> { session };
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction>();
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminResolveDisputeCommand(
            dispute.Id,
            adminId,
            DisputeResolutionDecision.StudentWinsFullRefund,
            null,
            "Pre-release full refund");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        // Tutor AvailableBalance is 100% untouched
        wallet.AvailableBalance.Should().Be(500_000m);
        wallet.HeldBalance.Should().Be(0m);

        // Refund transaction recorded
        var refundTx = transactions.FirstOrDefault(t => t.Type == TransactionType.StudentRefund);
        refundTx.Should().NotBeNull();
        refundTx!.Amount.Should().Be(1_000_000m);
        refundTx.Status.Should().Be(TransactionStatus.Pending);

        // Session status is resolved by admin
        session.Status.Should().Be(SessionStatus.Completed);
        session.ResolutionSource.Should().Be("DisputeAdminResolution");
    }

    [Fact]
    public async Task PreReleaseTutorWins_ReleasesNetPayoutToTutorAvailableBalance()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var studentUser = new User { Id = Guid.NewGuid() };
        var tutorUser = new User { Id = Guid.NewGuid() };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
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
            AvailableBalance = 0m
        };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            Session = session,
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };
        dispute.SetFinancialHold(1_000_000m, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, DateTime.UtcNow);
        dispute.MoveUnderReview(adminId, DateTime.UtcNow);

        var disputes = new List<Dispute> { dispute };
        var sessions = new List<Session> { session };
        var wallets = new List<Wallet> { wallet };
        var transactions = new List<Transaction>();
        var walletTransactions = new List<WalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(wallets).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(walletTransactions).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminResolveDisputeCommand(
            dispute.Id,
            adminId,
            DisputeResolutionDecision.TutorWinsReleaseEarning,
            null,
            "Tutor attended as scheduled");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        // Tutor credited with Net payout: 1,000,000 - 10% = 900,000
        wallet.AvailableBalance.Should().Be(900_000m);
        wallet.HeldBalance.Should().Be(0m);

        var payoutTx = transactions.FirstOrDefault(t => t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Should().NotBeNull();
        payoutTx!.PayoutAmount.Should().Be(900_000m);
        payoutTx.CommissionAmount.Should().Be(100_000m);
        payoutTx.Status.Should().Be(TransactionStatus.Released);
    }

    [Fact]
    public async Task Handle_WhenDisputeAlreadyClosed_ThrowsConflictException()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            Session = new Session { Enrollment = new Enrollment() }
        };
        dispute.ResolveByAdmin(adminId, DisputeResolutionDecision.DismissedNoFinancialChange, "Closed", DateTime.UtcNow);

        var disputes = new List<Dispute> { dispute };
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);

        var command = new AdminResolveDisputeCommand(
            dispute.Id,
            adminId,
            DisputeResolutionDecision.StudentWinsFullRefund,
            null,
            "Attempt re-resolution");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => _handler.Handle(command, CancellationToken.None));
    }
}
