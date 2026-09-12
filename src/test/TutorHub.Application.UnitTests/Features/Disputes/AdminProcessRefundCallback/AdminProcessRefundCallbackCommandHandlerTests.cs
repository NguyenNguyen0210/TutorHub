using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Disputes.AdminProcessRefundCallback;

public class AdminProcessRefundCallbackCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IAuditLogService> _auditLogServiceMock = new();
    private readonly AdminProcessRefundCallbackCommandHandler _handler;

    public AdminProcessRefundCallbackCommandHandlerTests()
    {
        _handler = new AdminProcessRefundCallbackCommandHandler(_contextMock.Object, _auditLogServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WhenProviderConfirmsSuccess_TransitionsRefundToSucceeded()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var refundTx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            Type = TransactionType.StudentRefund,
            Amount = 1_000_000m,
            Status = TransactionStatus.Pending
        };

        var transactions = new List<Transaction> { refundTx };
        var disputes = new List<Dispute>();
        var bookings = new List<Booking>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookings).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminProcessRefundCallbackCommand(
            RefundTransactionId: refundTx.Id,
            Outcome: TransactionStatus.Succeeded,
            ProviderReference: "VNPAY-REF-999",
            FailureReason: null,
            AdminUserId: adminId
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(TransactionStatus.Succeeded);
        result.SettlementRequired.Should().BeFalse();
        refundTx.Status.Should().Be(TransactionStatus.Succeeded);
        refundTx.PaymentGatewayRef.Should().Be("VNPAY-REF-999");
        refundTx.RefundedAt.Should().NotBeNull();

        _auditLogServiceMock.Verify(a => a.LogAsync(
            "RefundSettlementSucceeded",
            "Transaction",
            refundTx.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenSucceeded_RoutesRefundEventToStudentUserId_NotProfileId()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var studentUserId = Guid.NewGuid();
        var studentProfileId = Guid.NewGuid();

        var studentProfile = new StudentProfile
        {
            Id = studentProfileId,
            UserId = studentUserId
        };
        var enrollment = new Enrollment { Id = Guid.NewGuid() };
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            Enrollment = enrollment
        };

        var refundTx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Type = TransactionType.StudentRefund,
            Amount = 500_000m,
            Status = TransactionStatus.Pending
        };

        var outbox = new List<OutboxMessage>();
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Transaction> { refundTx }).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(new List<Dispute>()).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking> { booking }).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminProcessRefundCallbackCommand(
            RefundTransactionId: refundTx.Id,
            Outcome: TransactionStatus.Succeeded,
            ProviderReference: "PROV-1",
            FailureReason: null,
            AdminUserId: adminId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert: outbox event may target the UserId, never the StudentProfile Id.
        outbox.Should().HaveCount(1);
        outbox[0].EventType.Should().Be("RefundCompleted");
        outbox[0].Payload.Should().Contain(studentUserId.ToString());
        outbox[0].Payload.Should().NotContain(studentProfileId.ToString());
    }

    [Fact]
    public async Task Handle_WhenProviderSettlementFails_MarksRefundFailed_MaintainsInternalObligation_DoesNotRevertTutorDebit()
    {
        // Arrange (INV-REFUND-004 test)
        var adminId = Guid.NewGuid();
        var dispute = new Dispute
        {
            Id = Guid.NewGuid()
        };
        dispute.ResolveByAdmin(adminId, DisputeResolutionDecision.StudentWinsFullRefund, "Admin resolved", DateTime.UtcNow);

        var refundTx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            DisputeId = dispute.Id,
            Type = TransactionType.StudentRefund,
            Amount = 1_000_000m,
            Status = TransactionStatus.Pending
        };

        var transactions = new List<Transaction> { refundTx };
        var disputes = new List<Dispute> { dispute };
        var bookings = new List<Booking>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookings).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminProcessRefundCallbackCommand(
            RefundTransactionId: refundTx.Id,
            Outcome: TransactionStatus.Failed,
            ProviderReference: null,
            FailureReason: "Card expired or account closed",
            AdminUserId: adminId
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(TransactionStatus.Failed);
        result.SettlementRequired.Should().BeTrue();
        refundTx.Status.Should().Be(TransactionStatus.Failed);
        refundTx.SettlementRequired.Should().BeTrue();

        // Dispute is flagged for admin settlement intervention
        dispute.Status.Should().Be(DisputeStatus.RequiresAdminRefundSettlement);
        dispute.AdminNotes.Should().Contain("Card expired or account closed");

        _auditLogServiceMock.Verify(a => a.LogAsync(
            "RefundSettlementFailed",
            "Transaction",
            refundTx.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
