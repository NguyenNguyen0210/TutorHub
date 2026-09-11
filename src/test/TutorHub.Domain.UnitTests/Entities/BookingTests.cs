using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

// Wave 3: package-model lifecycle is Holding → Paid → Cancelled / Expired.
// Pending/Confirmed/Completed legacy states are gone.
public class BookingTests
{
    private static Booking CreateTestBooking(BookingStatus status = BookingStatus.Paid, decimal price = 1_000_000m)
    {
        return new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            TotalPrice = price,
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = status,
            CreatedAt = DateTime.UtcNow
        };
    }

    [Theory]
    [InlineData(BookingStatus.Holding)]
    public void CanCancel_WhenStudentCancelsActiveBooking_ReturnsTrue(BookingStatus status)
    {
        // Arrange
        var booking = CreateTestBooking(status);

        // Act
        var result = booking.CanCancel(CancelledBy.Student);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CanCancel_WhenStudentCancelsPaidBooking_ReturnsFalse()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Paid);

        // Act
        var result = booking.CanCancel(CancelledBy.Student);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CanCancel_WhenTutorCancelsPaidBooking_ReturnsFalse()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Paid);

        // Act
        var result = booking.CanCancel(CancelledBy.Tutor);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CanCancel_WhenTutorTriesToCancelHoldingBooking_ReturnsFalse()
    {
        // Arrange (Tutor cannot cancel holding checkout booking)
        var booking = CreateTestBooking(BookingStatus.Holding);

        // Act
        var result = booking.CanCancel(CancelledBy.Tutor);

        // Assert
        result.Should().BeFalse();
    }

    [Theory]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Expired)]
    public void CanCancel_WhenBookingAlreadyTerminal_ReturnsFalse(BookingStatus terminalStatus)
    {
        // Arrange
        var booking = CreateTestBooking(terminalStatus);

        // Act & Assert
        booking.CanCancel(CancelledBy.Student).Should().BeFalse();
        booking.CanCancel(CancelledBy.Tutor).Should().BeFalse();
        booking.CanCancel(CancelledBy.System).Should().BeFalse();
    }

    [Fact]
    public void CalculateRefund_WhenHolding_ReturnsZero()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Holding, 1_500_000m);

        // Act
        var (percentage, amount, payout) = booking.CalculateRefund(CancelledBy.Student);

        // Assert
        percentage.Should().Be(0);
        amount.Should().Be(0);
        payout.Should().Be(0);
    }

    [Fact]
    public void CalculateRefund_WhenPaid_ThrowsInvalidOperation()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Paid, 2_000_000m);

        // Act
        var act = () => booking.CalculateRefund(CancelledBy.Student);

        // Assert
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Cancel_WhenEligible_UpdatesStatusAndCancellationDetails()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Holding);
        var now = DateTime.UtcNow;

        // Act
        booking.Cancel(CancelledBy.Student, "Change of plans", now);

        // Assert
        booking.Status.Should().Be(BookingStatus.Cancelled);
        booking.CancelledBy.Should().Be(CancelledBy.Student);
        booking.CancellationReason.Should().Be("Change of plans");
        booking.CancelledAt.Should().Be(now);
    }

    [Fact]
    public void Cancel_WhenNotEligible_ThrowsInvalidOperationException()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Expired);
        var now = DateTime.UtcNow;

        // Act
        var act = () => booking.Cancel(CancelledBy.Student, "Try cancel expired", now);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel booking in 'Expired' status.");
    }

    [Fact]
    public void ReactivateForPayment_WhenSystemExpired_ReactivatesToPaid()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Cancelled);
        booking.CancelledBy = CancelledBy.System;
        booking.CancellationReason = "HoldingExpired";
        booking.CancelledAt = DateTime.UtcNow;
        booking.HoldingExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        var now = DateTime.UtcNow;

        // Act
        booking.ReactivateForPayment(now);

        // Assert
        booking.Status.Should().Be(BookingStatus.Paid);
        booking.CancelledBy.Should().BeNull();
        booking.CancellationReason.Should().BeNull();
        booking.CancelledAt.Should().BeNull();
        booking.HoldingExpiresAt.Should().BeNull();
        booking.ConfirmedAt.Should().Be(now);
    }

    [Fact]
    public void ReactivateForPayment_WhenCancelledByStudent_Throws()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Cancelled);
        booking.CancelledBy = CancelledBy.Student;

        // Act
        var act = () => booking.ReactivateForPayment(DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ReactivateForPayment_WhenNotCancelled_Throws()
    {
        // Arrange
        var booking = CreateTestBooking(BookingStatus.Holding);

        // Act
        var act = () => booking.ReactivateForPayment(DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>();
    }
}
