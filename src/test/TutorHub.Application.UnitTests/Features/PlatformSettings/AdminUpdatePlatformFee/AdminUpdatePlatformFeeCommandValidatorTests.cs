using FluentAssertions;
using TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.PlatformSettings.AdminUpdatePlatformFee;

/// <summary>
/// P0-A2: the fee rate is snapshotted into Enrollment (numeric(5,4)) and copied to
/// Transaction.CommissionRate. Rejecting more than 4 decimal places at the edge keeps
/// Postgres from silently rounding the value the DEC-S8-025 identity is derived from.
/// </summary>
public class AdminUpdatePlatformFeeCommandValidatorTests
{
    private readonly AdminUpdatePlatformFeeCommandValidator _validator = new();

    [Theory]
    [InlineData(0.00)]
    [InlineData(0.10)]
    [InlineData(0.1234)]
    [InlineData(0.50)]
    public void Validate_WhenRateIsWithinRangeAndScale_Passes(decimal rate)
    {
        var command = new AdminUpdatePlatformFeeCommand(rate, "Quarterly fee review.");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0.12345)]   // 5 decimal places
    [InlineData(0.1000001)] // 7 decimal places
    public void Validate_WhenRateHasMoreThanFourDecimalPlaces_Fails(decimal rate)
    {
        var command = new AdminUpdatePlatformFeeCommand(rate, "Attempted over-precise rate.");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "NewFeeRate");
    }

    [Theory]
    [InlineData(0.51)]
    [InlineData(-0.01)]
    [InlineData(1.00)]
    public void Validate_WhenRateIsOutOfRange_Fails(decimal rate)
    {
        var command = new AdminUpdatePlatformFeeCommand(rate, "Out of range attempt.");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "NewFeeRate");
    }

    [Fact]
    public void Validate_WhenReasonIsMissing_Fails()
    {
        var command = new AdminUpdatePlatformFeeCommand(0.10m, string.Empty);

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }
}
