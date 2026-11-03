using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Payments.GetPaymentResult;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Payments.GetPaymentResult;

public class GetPaymentResultQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPaymentGateway> _paymentGatewayMock = new();
    private readonly GetPaymentResultQueryHandler _handler;

    public GetPaymentResultQueryHandlerTests()
    {
        _paymentGatewayMock
            .Setup(s => s.VerifyAndParseCallback(It.IsAny<IReadOnlyDictionary<string, string>>()))
            .Returns(new PaymentCallbackResult(true, null, "THB260912ABC123", 900_000m, true, "987654321"));

        _handler = new GetPaymentResultQueryHandler(_contextMock.Object, _paymentGatewayMock.Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet<Booking>().Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet<Enrollment>().Object);
    }

    private void SetupTransactions(params Transaction[] transactions)
    {
        _contextMock
            .Setup(c => c.Transactions)
            .Returns(MockDbSetHelper.CreateMockDbSet(transactions.ToList()).Object);
    }

    private void SetupActivatedBooking(Guid bookingId)
    {
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>
        {
            new() { Id = bookingId, Status = BookingStatus.Paid }
        }).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>
        {
            new() { Id = Guid.NewGuid(), BookingId = bookingId }
        }).Object);
    }

    private static Dictionary<string, string> BuildParameters(string txnRef, string? transactionNo, string responseCode = "00")
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["vnp_SecureHash"] = "dummy",
            ["vnp_TxnRef"] = txnRef,
            ["vnp_TransactionNo"] = transactionNo ?? string.Empty,
            ["vnp_ResponseCode"] = responseCode,
            ["vnp_Amount"] = "90000000"
        };
    }

    [Fact]
    public async Task Handle_WhenGatewayRefWasRewrittenToCompositeForm_StillResolvesBooking()
    {
        // Arrange: the webhook rewrites PaymentGatewayRef to "txnRef|transactionNo".
        var bookingId = Guid.NewGuid();
        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Type = TransactionType.BookingPayment,
            Status = TransactionStatus.Held,
            Amount = 900_000m,
            PaymentGatewayRef = "THB260912ABC123|987654321",
            CreatedAt = DateTime.UtcNow
        };
        SetupTransactions(tx);
        SetupActivatedBooking(bookingId);

        var query = new GetPaymentResultQuery(
            BuildParameters(txnRef: "THB260912ABC123", transactionNo: "987654321"));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.BookingId.Should().Be(bookingId);
    }

    [Fact]
    public async Task Handle_WhenGatewayRefIsRawMerchantRef_ResolvesBooking()
    {
        // Arrange: before/without the composite rewrite the ref is the raw merchant ref.
        var bookingId = Guid.NewGuid();
        SetupActivatedBooking(bookingId);
        SetupTransactions(new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Type = TransactionType.BookingPayment,
            Status = TransactionStatus.Held,
            Amount = 900_000m,
            PaymentGatewayRef = "THB260912ABC123",
            CreatedAt = DateTime.UtcNow
        });

        var query = new GetPaymentResultQuery(
            BuildParameters(txnRef: "THB260912ABC123", transactionNo: "987654321"));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.BookingId.Should().Be(bookingId);
    }

    [Fact]
    public async Task Handle_WhenTransactionUnknown_ReturnsEmptyBookingId()
    {
        // Arrange
        SetupTransactions();

        var query = new GetPaymentResultQuery(
            BuildParameters(txnRef: "THB-NOT-FOUND", transactionNo: "1"));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.BookingId.Should().Be(Guid.Empty);
        result.Success.Should().BeFalse();
        result.Status.Should().Be("Failed");
    }

    [Fact]
    public async Task Handle_WhenGatewayReportsSuccessButTransactionPending_DoesNotClaimActivation()
    {
        SetupTransactions(new Transaction
        {
            Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), Amount = 900_000m,
            Status = TransactionStatus.Pending, PaymentGatewayRef = "THB260912ABC123"
        });
        var result = await _handler.Handle(new GetPaymentResultQuery(BuildParameters("THB260912ABC123", "987654321")), CancellationToken.None);
        result.Success.Should().BeFalse();
        result.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task Handle_WhenMoneyHeldButEnrollmentMissing_DoesNotClaimActivation()
    {
        SetupTransactions(new Transaction
        {
            Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), Amount = 900_000m,
            Status = TransactionStatus.Held, PaymentGatewayRef = "THB260912ABC123"
        });
        var result = await _handler.Handle(new GetPaymentResultQuery(BuildParameters("THB260912ABC123", "987654321")), CancellationToken.None);
        result.Success.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenAmountDoesNotMatch_DoesNotReportSuccess()
    {
        var bookingId = Guid.NewGuid();
        SetupActivatedBooking(bookingId);
        SetupTransactions(new Transaction
        {
            Id = Guid.NewGuid(), BookingId = bookingId, Amount = 1m,
            Status = TransactionStatus.Held, PaymentGatewayRef = "THB260912ABC123"
        });
        var result = await _handler.Handle(new GetPaymentResultQuery(BuildParameters("THB260912ABC123", "987654321")), CancellationToken.None);
        result.Success.Should().BeFalse();
        result.Status.Should().Be("Failed");
    }

    [Fact]
    public async Task Handle_WhenCaptureRequiresRefund_DoesNotClaimCourseWasActivated()
    {
        var tx = new Transaction
        {
            Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), Amount = 900_000m,
            Status = TransactionStatus.Held, PaymentGatewayRef = "THB260912ABC123|987654321"
        };
        SetupTransactions(tx, new Transaction
        {
            Id = Guid.NewGuid(), BookingId = tx.BookingId, Type = TransactionType.StudentRefund,
            SettlementRequired = true, PaymentGatewayRef = $"LateIpnRefund-{tx.Id:N}"
        });
        var result = await _handler.Handle(new GetPaymentResultQuery(BuildParameters("THB260912ABC123", "987654321")), CancellationToken.None);
        result.Success.Should().BeFalse();
        result.Status.Should().Be("RefundPending");
    }

    [Fact]
    public async Task Handle_WhenSignatureInvalid_ReturnsFailureWithoutLookup()
    {
        // Arrange
        _paymentGatewayMock
            .Setup(s => s.VerifyAndParseCallback(It.IsAny<IReadOnlyDictionary<string, string>>()))
            .Returns(new PaymentCallbackResult(false, PaymentCallbackError.InvalidSignature, null, 0, false, null));

        var query = new GetPaymentResultQuery(
            BuildParameters(txnRef: "THB260912ABC123", transactionNo: "987654321"));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.BookingId.Should().Be(Guid.Empty);
    }
}
