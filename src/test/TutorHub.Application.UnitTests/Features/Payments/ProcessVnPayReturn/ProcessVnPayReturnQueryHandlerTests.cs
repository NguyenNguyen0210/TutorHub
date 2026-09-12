using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payment;
using TutorHub.Application.Features.Payments.ProcessVnPayReturn;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Payments.ProcessVnPayReturn;

public class ProcessVnPayReturnQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IVnPayService> _vnPayServiceMock = new();
    private readonly ProcessVnPayReturnQueryHandler _handler;

    public ProcessVnPayReturnQueryHandlerTests()
    {
        _vnPayServiceMock
            .Setup(s => s.VerifySignature(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<string>()))
            .Returns(true);

        _handler = new ProcessVnPayReturnQueryHandler(_contextMock.Object, _vnPayServiceMock.Object);
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
        // Arrange: the IPN rewrites PaymentGatewayRef to "txnRef|transactionNo".
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

        var query = new ProcessVnPayReturnQuery(
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

        var query = new ProcessVnPayReturnQuery(
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

        var query = new ProcessVnPayReturnQuery(
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
        _vnPayServiceMock
            .Setup(s => s.VerifySignature(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<string>()))
            .Returns(false);

        var query = new ProcessVnPayReturnQuery(
            BuildParameters(txnRef: "THB260912ABC123", transactionNo: "987654321"));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.BookingId.Should().Be(Guid.Empty);
    }
}
