using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.Commands.FastTrackResolveDispute;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Disputes.FastTrackResolveDispute;

public class FastTrackResolveDisputeCommandHandlerTests
{
    private readonly DateTime _fixedNow = new(2026, 9, 26, 10, 0, 0, DateTimeKind.Utc);
    private const decimal Gross = 1_000_000m;
    private const decimal FeeRate = 0.2m;

    private readonly Mock<IAppDbContext> _context = new();
    private readonly Mock<IFastTrackDisputeLocker> _locker = new();
    private readonly Mock<IStudentWalletService> _walletService = new();
    private readonly Mock<IAuditLogService> _auditLogService = new();
    private readonly StubCurrentUserService _currentUser = new();

    private FastTrackResolveDisputeCommandHandler CreateHandler() =>
        new(_context.Object, new StubClock(_fixedNow), _auditLogService.Object,
            _currentUser, _walletService.Object, _locker.Object);

    private sealed record Seed(
        Dispute Dispute,
        Session Session,
        Enrollment Enrollment,
        TutorWallet Wallet,
        List<Transaction> Transactions,
        List<OutboxMessage> Outbox);

    private Seed Arrange(bool studentAttendedSide)
    {
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);

        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student" };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            TotalPrice = Gross,
            TotalSessions = 1,
            PlatformFeeRate = FeeRate
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 3,
            EarningAmount = Gross
        };
        session.Schedule(_fixedNow.AddDays(-10).AddHours(-1), _fixedNow.AddDays(-10));
        session.TryOpenAttendanceVerificationWindow(_fixedNow.AddDays(-9), TimeSpan.FromDays(1));
        if (studentAttendedSide)
        {
            session.SubmitStudentAttendance(AttendanceStatus.Attended, _fixedNow);
        }
        else
        {
            session.SubmitTutorAttendance(AttendanceStatus.Attended, _fixedNow);
        }

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            Session = session,
            InitiatorUserId = studentUser.Id,
            InitiatorUser = studentUser,
            RespondentUserId = tutorUser.Id,
            RespondentUser = tutorUser,
            Reason = DisputeReason.TutorNoShow,
            Description = "Tutor ghosted",
            Evidences = new List<DisputeEvidence>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    UploadedByUserId = studentUser.Id,
                    FileName = "proof.png",
                    FileUrl = "https://files.local/proof.png",
                    ContentType = "image/png",
                    FileSizeBytes = 12
                }
            }
        };

        var wallet = new TutorWallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            PendingBalance = Gross,
            AvailableBalance = 0m
        };

        var disputes = new List<Dispute> { dispute };
        var transactions = new List<Transaction>();
        var walletTransactions = new List<TutorWalletTransaction>();
        var outbox = new List<OutboxMessage>();

        _context.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _context.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        var walletTxMock = MockDbSetHelper.CreateMockDbSet(walletTransactions);
        _context.Setup(c => c.TutorWalletTransactions).Returns(walletTxMock.Object);
        _context.SetupGet(c => c.WalletTransactions).Returns(walletTxMock.Object);
        _context.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);
        _context.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var facadeMock = new Mock<DatabaseFacade>(new Mock<DbContext>(new DbContextOptions<DbContext>()).Object);
        facadeMock.Setup(f => f.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<IDbContextTransaction>());
        _context.Setup(c => c.Database).Returns(facadeMock.Object);

        _locker.Setup(l => l.LockTutorWalletAsync(wallet.TutorProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        return new Seed(dispute, session, enrollment, wallet, transactions, outbox);
    }

    [Fact]
    public async Task Handle_WhenStudentAttendedAndTutorSilent_CreditsWalletAndCompletesRefund()
    {
        // Arrange
        var seed = Arrange(studentAttendedSide: true);
        var command = new FastTrackResolveDisputeCommand(seed.Dispute.Id, "Fast-track notes");

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        result.ResolutionDecision.Should().Be(DisputeResolutionDecision.StudentWinsFullRefund);
        seed.Dispute.Status.Should().Be(DisputeStatus.Resolved);

        _walletService.Verify(s => s.CreditRefundAsync(
            seed.Enrollment.StudentProfileId,
            Gross,
            "DisputeResolution",
            seed.Dispute.Id,
            It.IsAny<string>(),
            _fixedNow,
            It.IsAny<CancellationToken>()), Times.Once);

        seed.Transactions.Should().ContainSingle();
        var refund = seed.Transactions[0];
        refund.Type.Should().Be(TransactionType.StudentRefund);
        refund.Amount.Should().Be(Gross);
        refund.Status.Should().Be(TransactionStatus.Succeeded);
        refund.RefundedAt.Should().Be(_fixedNow);
        refund.SettlementRequired.Should().BeFalse();

        seed.Outbox.Select(m => m.EventType).Should().BeEquivalentTo(
            "RefundCreated", "RefundCompleted", "DisputeResolved");

        _context.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenTutorAttendedAndStudentSilent_ReleasesPayoutWithoutRefund()
    {
        // Arrange
        var seed = Arrange(studentAttendedSide: false);
        var command = new FastTrackResolveDisputeCommand(seed.Dispute.Id, "Fast-track notes");

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        result.ResolutionDecision.Should().Be(DisputeResolutionDecision.TutorWinsReleaseEarning);
        seed.Dispute.Status.Should().Be(DisputeStatus.Resolved);

        _walletService.Verify(s => s.CreditRefundAsync(
            It.IsAny<Guid>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<Guid?>(),
            It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);

        seed.Transactions.Should().ContainSingle();
        var payout = seed.Transactions[0];
        payout.Type.Should().Be(TransactionType.SessionPayoutCredit);
        payout.Amount.Should().Be(Gross);
        payout.Status.Should().Be(TransactionStatus.Released);
        payout.ReleasedAt.Should().Be(_fixedNow);
        payout.CommissionRate.Should().Be(FeeRate);
        payout.CommissionAmount.Should().Be(200_000m);
        payout.PayoutAmount.Should().Be(800_000m);

        seed.Wallet.AvailableBalance.Should().Be(800_000m);
        seed.Wallet.PendingBalance.Should().Be(0m);

        _context.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
