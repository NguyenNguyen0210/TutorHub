using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformRevenueAnalytics;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.PlatformSettings.AdminGetPlatformRevenueAnalytics;

public class AdminGetPlatformRevenueAnalyticsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly AdminGetPlatformRevenueAnalyticsQueryHandler _handler;

    public AdminGetPlatformRevenueAnalyticsQueryHandlerTests()
    {
        _handler = new AdminGetPlatformRevenueAnalyticsQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ReconcilesNetPlatformRevenueWithReversals()
    {
        // Arrange
        // Released session earning: Gross 1,000,000; Commission 100,000
        var earningTx = new Transaction
        {
            Id = Guid.NewGuid(),
            Type = TransactionType.SessionPayoutCredit,
            Amount = 1_000_000m,
            CommissionAmount = 100_000m,
            PayoutAmount = 900_000m,
            Status = TransactionStatus.Released
        };

        // Platform fee reversal from dispute: 40,000
        var reversalTx = new Transaction
        {
            Id = Guid.NewGuid(),
            Type = TransactionType.PlatformFeeReversal,
            Amount = 0m,
            CommissionAmount = 40_000m,
            Status = TransactionStatus.Succeeded
        };

        // Student refund from dispute: 400,000
        var refundTx = new Transaction
        {
            Id = Guid.NewGuid(),
            Type = TransactionType.StudentRefund,
            Amount = 400_000m,
            Status = TransactionStatus.Pending
        };

        var transactions = new List<Transaction> { earningTx, reversalTx, refundTx };
        var sessions = new List<Session>();
        var disputes = new List<Dispute>
        {
            new() { Id = Guid.NewGuid() } // dummy dispute
        };

        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);

        // Act
        var result = await _handler.Handle(new AdminGetPlatformRevenueAnalyticsQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.RecognizedPlatformFee.Should().Be(100_000m);
        result.PlatformFeeReversals.Should().Be(40_000m);
        result.NetRecognizedPlatformRevenue.Should().Be(60_000m); // 100k - 40k = 60k
        result.DisputeMetrics.TotalRefundedToStudents.Should().Be(400_000m);
        result.DisputeMetrics.TotalRecoveredFromTutors.Should().Be(360_000m); // 400k - 40k = 360k
        result.DisputeMetrics.TotalFeeReversed.Should().Be(40_000m);
    }

    [Fact]
    public async Task Handle_ExcludesUnreleasedPendingEscrowFromRecognizedRevenue()
    {
        // Arrange
        // Unreleased session in pending escrow
        var pendingSession = new Session
        {
            Id = Guid.NewGuid(),
            EarningAmount = 2_000_000m,
            Enrollment = new Enrollment { PlatformFeeRate = 0.10m }
        };

        var sessions = new List<Session> { pendingSession };
        var transactions = new List<Transaction>();
        var disputes = new List<Dispute>();

        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);

        // Act
        var result = await _handler.Handle(new AdminGetPlatformRevenueAnalyticsQuery(), CancellationToken.None);

        // Assert
        result.RecognizedPlatformFee.Should().Be(0m);
        result.NetRecognizedPlatformRevenue.Should().Be(0m);
        result.UnrecognizedPendingPlatformFee.Should().Be(200_000m); // 2,000,000 * 0.10 in pending escrow
    }

    [Fact]
    public async Task Handle_ZeroFeeRate_DoesNotApplyFallbackFee()
    {
        // Arrange: a legitimate 0% snapshot must stay 0, never coerced to 10%.
        var pendingSession = new Session
        {
            Id = Guid.NewGuid(),
            EarningAmount = 2_000_000m,
            Enrollment = new Enrollment { PlatformFeeRate = 0m }
        };

        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Transaction>()).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { pendingSession }).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(new List<Dispute>()).Object);

        // Act
        var result = await _handler.Handle(new AdminGetPlatformRevenueAnalyticsQuery(), CancellationToken.None);

        // Assert
        result.UnrecognizedPendingPlatformFee.Should().Be(0m);
    }
}
