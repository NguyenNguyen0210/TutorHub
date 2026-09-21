using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Settings;
using TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;

namespace TutorHub.Api.HealthChecks;

/// <summary>
/// P0-A5 / P0-E3: a deployable instance must know the platform fee rate before it
/// accepts money — enrollment activation snapshots it with no fallback, so a missing
/// or malformed setting means every successful payment would fail to activate.
///
/// Readiness therefore reports exactly what activation requires, using the same
/// rule (<see cref="PlatformFeeRateSetting.TryParse"/>).
/// </summary>
public class PlatformFeeSettingHealthCheck : IHealthCheck
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PlatformFeeSettingHealthCheck(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var setting = await dbContext.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == PlatformSettingKeys.PlatformFeeRate, cancellationToken);

        if (setting == null)
        {
            return HealthCheckResult.Unhealthy(
                $"Platform setting '{PlatformSettingKeys.PlatformFeeRate}' is missing. Configure it via " +
                "PUT /api/v1/admin/platform-settings/fee-rate before accepting payments.");
        }

        if (!PlatformFeeRateSetting.TryParse(setting.Value, out var feeRate))
        {
            return HealthCheckResult.Unhealthy(
                $"Platform setting '{PlatformSettingKeys.PlatformFeeRate}' has invalid value " +
                $"'{setting.Value}'. Expected an invariant-culture decimal in [0,1).");
        }

        return HealthCheckResult.Healthy(
            $"Platform fee rate {feeRate.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)} " +
            $"(policy version {setting.CurrentVersion}).");
    }
}
