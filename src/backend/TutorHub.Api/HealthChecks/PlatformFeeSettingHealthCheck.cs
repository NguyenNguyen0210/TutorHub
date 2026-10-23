using System.Globalization;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Settings;

namespace TutorHub.Api.HealthChecks;

/// <summary>
/// A deployable instance must know the platform fee rate before it
/// accepts money — enrollment activation snapshots it with no fallback, so a missing
/// or malformed setting means every successful payment would fail to activate.
///
/// Readiness therefore reports exactly what activation requires.
/// </summary>
public class PlatformFeeSettingHealthCheck : IHealthCheck
{
    private readonly PlatformFeeOptions _feeOptions;

    public PlatformFeeSettingHealthCheck(IOptions<PlatformFeeOptions> feeOptions)
    {
        _feeOptions = feeOptions.Value;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (!_feeOptions.Rate.HasValue)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                "Platform fee rate configuration 'PlatformFeeRate' is missing. Configure it in .env or appsettings.json before accepting payments."));
        }

        var feeRate = _feeOptions.Rate.Value;
        if (feeRate < 0m || feeRate >= 1m)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                $"Platform fee rate configuration 'PlatformFeeRate' has invalid value '{feeRate}'. Expected an invariant-culture decimal in [0,1)."));
        }

        return Task.FromResult(HealthCheckResult.Healthy(
            $"Platform fee rate {feeRate.ToString("F4", CultureInfo.InvariantCulture)} is configured."));
    }
}
