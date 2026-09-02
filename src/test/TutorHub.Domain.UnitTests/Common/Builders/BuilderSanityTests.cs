using FluentAssertions;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class BuilderSanityTests
{
    [Fact]
    public void BookingBuilder_Build_ShouldCreateValidDefaultBooking()
    {
        // Act
        var booking = new BookingBuilder().Build();

        // Assert
        booking.Should().NotBeNull();
        booking.Id.Should().NotBeEmpty();
        booking.Status.Should().Be(BookingStatus.Pending);
        booking.TotalPrice.Should().Be(200_000m);
        booking.TotalSessions.Should().Be(1);
        booking.StudentProfile.Should().NotBeNull();
        booking.StudentProfile.User.Should().NotBeNull();
        booking.StudentProfile.User.Role.Should().Be(UserRole.Student);
        booking.TutorProfile.Should().NotBeNull();
        booking.TutorProfile.User.Should().NotBeNull();
        booking.TutorProfile.User.Role.Should().Be(UserRole.Tutor);
        booking.Subject.Should().NotBeNull();
        booking.Transaction.Should().BeNull(); // Transaction is optional
    }

    [Fact]
    public void BookingBuilder_WithStatus_ShouldOverrideStatus()
    {
        // Act
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        // Assert
        booking.Status.Should().Be(BookingStatus.Confirmed);
    }

    [Fact]
    public void BookingBuilder_WithCancellation_ShouldConfigureCancellationState()
    {
        // Act
        var cancellationTime = new DateTime(2030, 1, 9, 15, 30, 0, DateTimeKind.Utc);
        var booking = new BookingBuilder()
            .WithCancellation(CancelledBy.Tutor, "Sick leave", cancellationTime)
            .Build();

        // Assert
        booking.Status.Should().Be(BookingStatus.Cancelled);
        booking.CancelledBy.Should().Be(CancelledBy.Tutor);
        booking.CancellationReason.Should().Be("Sick leave");
        booking.CancelledAt.Should().Be(cancellationTime);
    }

    [Fact]
    public void TransactionBuilder_Build_ShouldCalculateDerivedCommissionAndPayout()
    {
        // Act (Amount: 500,000, CommissionRate: 15%)
        var transaction = new TransactionBuilder()
            .WithAmount(500_000m)
            .WithCommissionRate(15m)
            .Build();

        // Assert: Commission = 75,000, Payout = 425,000
        transaction.Amount.Should().Be(500_000m);
        transaction.CommissionRate.Should().Be(15m);
        transaction.CommissionAmount.Should().Be(75_000m);
        transaction.PayoutAmount.Should().Be(425_000m);
    }

    [Fact]
    public void TransactionBuilder_WithCustomAmounts_ShouldRespectCustomValues()
    {
        // Act
        var transaction = new TransactionBuilder()
            .WithAmount(300_000m)
            .WithCustomAmounts(commissionAmount: 50_000m, payoutAmount: 250_000m)
            .Build();

        // Assert
        transaction.CommissionAmount.Should().Be(50_000m);
        transaction.PayoutAmount.Should().Be(250_000m);
    }
}
