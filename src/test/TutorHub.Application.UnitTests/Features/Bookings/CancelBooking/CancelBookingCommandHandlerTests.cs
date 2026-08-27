using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.CancelBooking;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Bookings.CancelBooking;

public class CancelBookingCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CancelBookingCommandHandler _handler;

    public CancelBookingCommandHandlerTests()
    {
        _handler = new CancelBookingCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenStudentCancelsPendingBooking_ShouldCancelAndSave()
    {
        // Arrange - Setup a pending booking starting 2 days in the future
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Pending)
            .WithSchedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1))
            .Build();

        var studentUserId = booking.StudentProfile.UserId;
        var bookingsList = new List<Booking> { booking };
        var walletsList = new List<Wallet>();

        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(walletsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CancelBookingCommand(booking.Id, studentUserId, UserRole.Student, "Schedule conflict");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(BookingStatus.Cancelled);
        result.CancelledBy.Should().Be(CancelledBy.Student);
        result.CancellationReason.Should().Be("Schedule conflict");

        booking.Status.Should().Be(BookingStatus.Cancelled);
        booking.CancelledBy.Should().Be(CancelledBy.Student);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenBookingHasHeldTransaction_ShouldRefundTransactionAndUpdateTutorWallet()
    {
        // Arrange - Booking with Held transaction (200,000 VND) and tutor wallet having pending balance
        var transaction = new TransactionBuilder()
            .WithAmount(200_000m)
            .WithStatus(TransactionStatus.Held)
            .Build();

        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Confirmed)
            .WithPricing(200_000m, 200_000m)
            .WithSchedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1))
            .WithTransaction(transaction)
            .Build();

        var tutorWallet = new WalletBuilder()
            .WithTutorProfileId(booking.TutorProfileId)
            .WithBalances(pending: 200_000m, available: 0m)
            .Build();

        var bookingsList = new List<Booking> { booking };
        var walletsList = new List<Wallet> { tutorWallet };

        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(walletsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var studentUserId = booking.StudentProfile.UserId;
        var command = new CancelBookingCommand(booking.Id, studentUserId, UserRole.Student, "Emergency cancel");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(BookingStatus.Cancelled);

        // 1. Transaction state transitioned to Refunded
        transaction.Status.Should().Be(TransactionStatus.Refunded);
        transaction.RefundedAt.Should().NotBeNull();

        // 2. Tutor wallet pending balance decremented
        tutorWallet.PendingBalance.Should().Be(0m);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenBookingDoesNotExist_ShouldThrowNotFoundException()
    {
        // Arrange
        var bookingsList = new List<Booking>();
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);

        var nonExistentId = Guid.NewGuid();
        var command = new CancelBookingCommand(nonExistentId, Guid.NewGuid(), UserRole.Student, "Reason");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.NotFound);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUserIsNotParticipant_ShouldThrowForbiddenException()
    {
        // Arrange - Booking exists with separate Student and Tutor users
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Pending)
            .Build();

        var bookingsList = new List<Booking> { booking };
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);

        var unauthorizedUserId = Guid.NewGuid();
        var command = new CancelBookingCommand(booking.Id, unauthorizedUserId, UserRole.Student, "Intruder cancel");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenBookingAlreadyCompleted_ShouldThrowConflictException()
    {
        // Arrange - Booking is already completed and cannot be cancelled
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Completed)
            .Build();

        var bookingsList = new List<Booking> { booking };
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);

        var studentUserId = booking.StudentProfile.UserId;
        var command = new CancelBookingCommand(booking.Id, studentUserId, UserRole.Student, "Cannot cancel finished session");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Conflict);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
