using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;
using TutorHub.Api.HealthChecks;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-A5 / P0-E3: readiness must fail while the platform fee setting is missing or
/// malformed, because enrollment activation snapshots it with no fallback — every
/// successful payment would otherwise fail to activate.
///
/// This class owns a dedicated database: it deliberately leaves the setting absent,
/// which must not disturb the shared integration database other tests depend on.
/// </summary>
public class PlatformFeeSettingHealthCheckTests
{
    private const string ProbeDatabase = "tutorhub_healthcheck_probe";
    private const string MaintenanceConnectionString =
        "Host=localhost;Port=5432;Database=postgres;Username=tutorhub;Password=123456";
    private static readonly string ProbeConnectionString =
        $"Host=localhost;Port=5432;Database={ProbeDatabase};Username=tutorhub;Password=123456";
    private static readonly object Sync = new();
    private static bool _initialized;

    [Fact]
    public async Task Check_WhenTheSettingIsMissing_IsUnhealthy()
    {
        var result = await CheckAsync(feeValue: null);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("missing");
    }

    [Theory]
    [InlineData("not-a-number")]
    [InlineData("1.5")]
    [InlineData("-0.1")]
    [InlineData("")]
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
        await SetFeeSettingAsync(feeValue);

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                ProbeConnectionString,
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        await using var provider = services.BuildServiceProvider();
        var check = new PlatformFeeSettingHealthCheck(
            provider.GetRequiredService<IServiceScopeFactory>());

        return await check.CheckHealthAsync(new HealthCheckContext());
    }

    private static async Task SetFeeSettingAsync(string? feeValue)
    {
        EnsureProbeDatabase();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ProbeConnectionString)
            .Options;

        await using var context = new AppDbContext(options);

        // Deleting the setting cascades to its version rows (configured FK).
        var existing = await context.PlatformSettings.ToListAsync();
        context.PlatformSettings.RemoveRange(existing);
        await context.SaveChangesAsync();

        if (feeValue is not null)
        {
            context.PlatformSettings.Add(new PlatformSetting
            {
                Id = Guid.NewGuid(),
                Key = "PlatformFeeRate",
                Value = feeValue,
                Description = "P0-E3 readiness probe fixture.",
                CurrentVersion = 1,
                UpdatedAt = DateTime.UtcNow
            });

            await context.SaveChangesAsync();
        }
    }

    private static void EnsureProbeDatabase()
    {
        lock (Sync)
        {
            if (_initialized)
            {
                return;
            }

            using (var connection = new NpgsqlConnection(MaintenanceConnectionString))
            {
                connection.Open();

                using var probe = connection.CreateCommand();
                probe.CommandText = $"SELECT 1 FROM pg_database WHERE datname = '{ProbeDatabase}'";

                if (probe.ExecuteScalar() == null)
                {
                    using var create = connection.CreateCommand();
                    create.CommandText = $"CREATE DATABASE {ProbeDatabase}";
                    create.ExecuteNonQuery();
                }
            }

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(
                    ProbeConnectionString,
                    npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
                .Options;

            using (var context = new AppDbContext(options))
            {
                context.Database.Migrate();
            }

            _initialized = true;
        }
    }
}
