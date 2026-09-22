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
    }

    private void SetupTransactions(params Transaction[] transactions)
    {
        _contextMock
            .Setup(c => c.Transactions)
            .Returns(MockDbSetHelper.CreateMockDbSet(transactions.ToList()).Object);
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
