using FluentAssertions;
using TutorHub.Domain.Services;
using Xunit;

namespace TutorHub.Domain.UnitTests.Services;

public class EnrollmentSessionAllocatorTests
{
    [Fact]
    public void Allocate_EvenDivision_ReturnsEqualAmounts()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(3_000_000m, 3);

        // Assert
        allocations.Should().Equal(1_000_000m, 1_000_000m, 1_000_000m);
    }

    [Fact]
    public void Allocate_UnevenDivision_LastSessionGetsRemainder()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(1_000_000m, 3);

        // Assert
        allocations.Should().Equal(333_333m, 333_333m, 333_334m);
    }

    [Fact]
    public void Allocate_SumAlwaysEqualsTotal_3Sessions()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(1_000_000m, 3);

        // Assert
        allocations.Sum().Should().Be(1_000_000m);
    }

    [Fact]
    public void Allocate_SumAlwaysEqualsTotal_10Sessions()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(3_500_000m, 10);

        // Assert
        allocations.Sum().Should().Be(3_500_000m);
        allocations.Should().HaveCount(10);
    }

    [Fact]
    public void Allocate_SumAlwaysEqualsTotal_LargeRemainder()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(1_000_001m, 3);

        // Assert
        allocations.Sum().Should().Be(1_000_001m);
        allocations[0].Should().Be(333_333m);
        allocations[1].Should().Be(333_333m);
        allocations[2].Should().Be(333_335m);
    }

    [Fact]
    public void Allocate_SingleSession_FullPrice()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(500_000m, 1);

        // Assert
        allocations.Should().Equal(500_000m);
    }

    [Fact]
    public void Allocate_ZeroPrice_ReturnsAllZeros()
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(0m, 5);

        // Assert
        allocations.Should().Equal(0m, 0m, 0m, 0m, 0m);
        allocations.Sum().Should().Be(0m);
    }

    [Theory]
    [InlineData(100_000, 1)]
    [InlineData(100_000, 5)]
    [InlineData(100_000, 10)]
    [InlineData(2_345_678, 7)]
    public void Allocate_CountMatchesN(decimal price, int sessions)
    {
        // Arrange & Act
        var allocations = EnrollmentSessionAllocator.Allocate(price, sessions);

        // Assert
        allocations.Should().HaveCount(sessions);
        allocations.Sum().Should().Be(price);
    }

    [Fact]
    public void Allocate_ZeroSessions_ThrowsArgumentException()
    {
        // Arrange & Act
        var act = () => EnrollmentSessionAllocator.Allocate(1_000_000m, 0);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("totalSessions");
    }

    [Fact]
    public void Allocate_NegativePrice_ThrowsArgumentException()
    {
        // Arrange & Act
        var act = () => EnrollmentSessionAllocator.Allocate(-100m, 3);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("totalPrice");
    }
}
