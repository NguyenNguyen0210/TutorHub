using FluentAssertions;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;
using Xunit;

namespace TutorHub.Domain.UnitTests.Services;

public class DisputeFinancialCalculatorTests
{
    private const decimal Gross = 200_000m;

    [Fact]
    public void CalculateFinancialSplit_WhenStudentWinsFullRefund_RefundsEntireGrossToStudent()
    {
        var (studentRefund, tutorRelease) = DisputeFinancialCalculator.CalculateFinancialSplit(
            Gross,
            DisputeResolutionDecision.StudentWinsFullRefund);

        studentRefund.Should().Be(Gross);
        tutorRelease.Should().Be(0m);
        (studentRefund + tutorRelease).Should().Be(Gross);
    }

    [Fact]
    public void CalculateFinancialSplit_WhenTutorWinsReleaseEarning_ReleasesEntireGrossToTutor()
    {
        var (studentRefund, tutorRelease) = DisputeFinancialCalculator.CalculateFinancialSplit(
            Gross,
            DisputeResolutionDecision.TutorWinsReleaseEarning);

        studentRefund.Should().Be(0m);
        tutorRelease.Should().Be(Gross);
        (studentRefund + tutorRelease).Should().Be(Gross);
    }

    [Fact]
    public void CalculateFinancialSplit_WhenStudentWinsPartialRefund_SplitsCorrectly()
    {
        var customRefund = 75_000m;

        var (studentRefund, tutorRelease) = DisputeFinancialCalculator.CalculateFinancialSplit(
            Gross,
            DisputeResolutionDecision.StudentWinsPartialRefund,
            customRefund);

        studentRefund.Should().Be(75_000m);
        tutorRelease.Should().Be(125_000m);
        (studentRefund + tutorRelease).Should().Be(Gross);
    }

    [Fact]
    public void CalculateFinancialSplit_WhenDismissedNoFinancialChange_ReturnsZeroes()
    {
        var (studentRefund, tutorRelease) = DisputeFinancialCalculator.CalculateFinancialSplit(
            Gross,
            DisputeResolutionDecision.DismissedNoFinancialChange);

        studentRefund.Should().Be(0m);
        tutorRelease.Should().Be(0m);
    }

    [Fact]
    public void CalculateFinancialSplit_WhenPartialRefundMissingAmount_ThrowsArgumentException()
    {
        Action act = () => DisputeFinancialCalculator.CalculateFinancialSplit(
            Gross,
            DisputeResolutionDecision.StudentWinsPartialRefund,
            customRefundAmount: null);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*CustomRefundAmount is required*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10_000)]
    [InlineData(200_000)] // equals gross (must be strictly less than gross, otherwise it's full refund)
    [InlineData(250_000)] // exceeds gross
    public void CalculateFinancialSplit_WhenPartialRefundAmountOutOfRange_ThrowsArgumentOutOfRangeException(decimal invalidAmount)
    {
        Action act = () => DisputeFinancialCalculator.CalculateFinancialSplit(
            Gross,
            DisputeResolutionDecision.StudentWinsPartialRefund,
            invalidAmount);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void CalculateFinancialSplit_WhenGrossIsNegative_ThrowsArgumentOutOfRangeException()
    {
        Action act = () => DisputeFinancialCalculator.CalculateFinancialSplit(
            -100m,
            DisputeResolutionDecision.StudentWinsFullRefund);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
