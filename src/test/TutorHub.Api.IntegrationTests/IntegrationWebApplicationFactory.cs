using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// F-30: integration harness against the developer's local Postgres container
/// (no Testcontainers by owner decision). Uses a dedicated database so the
/// dev seed data stays untouched. Background jobs are removed: tests assert
/// synchronously committed state, and jobs would otherwise race them.
/// </summary>
public class IntegrationWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string IntegrationConnectionString =
        "Host=localhost;Port=5432;Database=tutorhub_integration;Username=tutorhub;Password=123456";

    private static readonly object Sync = new();
    private static bool _initialized;

    /// <summary>
    /// Shared ambient current-user. Singleton so tests can set the acting user
    /// before dispatch; replaces the real HTTP-context-based implementation.
    /// </summary>
    public TestCurrentUserService CurrentUser { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = IntegrationConnectionString
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove all background workers: deterministic tests only.
            var hosted = services
                .Where(d => d.ServiceType == typeof(IHostedService))
                .ToList();
            foreach (var descriptor in hosted)
            {
                services.Remove(descriptor);
            }

            // Replace the HTTP-context current-user with an ambient test stub.
            var currentUserDescriptors = services
                .Where(d => d.ServiceType == typeof(TutorHub.Application.Common.Interfaces.ICurrentUserService))
                .ToList();
            foreach (var descriptor in currentUserDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<TutorHub.Application.Common.Interfaces.ICurrentUserService>(CurrentUser);
        });
    }

    /// <summary>
    /// Creates the integration database (if missing) and applies all migrations.
    /// Safe to call multiple times; runs once per test process.
    /// </summary>
    public static void EnsureDatabase()
    {
        lock (Sync)
        {
            if (_initialized)
            {
                return;
            }

            var maintenanceCs =
                "Host=localhost;Port=5432;Database=postgres;Username=tutorhub;Password=123456";
            using (var conn = new NpgsqlConnection(maintenanceCs))
            {
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT 1 FROM pg_database WHERE datname = 'tutorhub_integration'";
                var exists = cmd.ExecuteScalar() != null;
                if (!exists)
                {
                    using var create = conn.CreateCommand();
                    create.CommandText = "CREATE DATABASE tutorhub_integration";
                    create.ExecuteNonQuery();
                }
            }

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(
                    IntegrationConnectionString,
                    npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
                .Options;

            using (var context = new AppDbContext(options))
            {
                context.Database.Migrate();

                // P0-A1: enrollment activation no longer falls back to a guessed fee,
                // so the platform fee setting is a hard prerequisite — exactly as in
                // production. Seed it once; tests that exercise fee changes create
                // their own versions on top.
                if (!context.PlatformSettings.Any(s => s.Key == "PlatformFeeRate"))
                {
                    context.PlatformSettings.Add(new PlatformSetting
                    {
                        Id = Guid.NewGuid(),
                        Key = "PlatformFeeRate",
                        Value = "0.10",
                        Description = "Platform commission rate snapshot source (DEC-S8-020).",
                        CurrentVersion = 1,
                        UpdatedAt = DateTime.UtcNow
                    });

                    context.SaveChanges();
                }
            }

            _initialized = true;
        }
    }
}
