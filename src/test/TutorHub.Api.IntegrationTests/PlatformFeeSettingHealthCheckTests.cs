using System.Globalization;
using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using TutorHub.Api.HealthChecks;
using TutorHub.Application.Common.Settings;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// Readiness must fail while the platform fee setting is missing or
/// malformed, because enrollment activation snapshots it with no fallback — every
/// successful payment would otherwise fail to activate.
/// </summary>
public class PlatformFeeSettingHealthCheckTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Check_WhenTheSettingIsMissing_IsUnhealthy(string? feeValue)
    {
        var result = await CheckAsync(feeValue);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("missing");
    }

    [Theory]
    [InlineData("not-a-number")]
    [InlineData("1.5")]
    [InlineData("-0.1")]
    public async Task Check_WhenTheSettingIsNotAUsableRate_IsUnhealthy(string feeValue)
    {
        var result = await CheckAsync(feeValue);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("invalid value");
    }

    [Fact]
    public async Task Check_WhenTheSettingIsAUsableRate_IsHealthy()
    {
        var result = await CheckAsync("0.1234");

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("0.1234");
    }

    private static async Task<HealthCheckResult> CheckAsync(string? feeValue)
    {
        var feeOptions = new PlatformFeeOptions();
        if (feeValue == null || string.IsNullOrWhiteSpace(feeValue))
        {
            feeOptions.Rate = null;
        }
        else if (decimal.TryParse(feeValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed))
        {
            feeOptions.Rate = parsed;
        }
        else
        {
            feeOptions.Rate = -1m;
        }

        var check = new PlatformFeeSettingHealthCheck(Options.Create(feeOptions));

        return await check.CheckHealthAsync(new HealthCheckContext());
    }
}
