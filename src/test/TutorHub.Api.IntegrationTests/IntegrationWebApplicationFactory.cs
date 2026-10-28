using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using TutorHub.Application.Common.Storage;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// Integration harness against the developer's local Postgres container
/// (no Testcontainers by owner decision). Uses a dedicated database so the
/// dev seed data stays untouched. Background jobs are removed: tests assert
/// synchronously committed state, and jobs would otherwise race them.
/// </summary>
public class IntegrationWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly string Port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5433";
    private static readonly string Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "123456";
    private static readonly string DatabaseName = GetTestDatabaseName();

    public static readonly string IntegrationConnectionString =
        $"Host=localhost;Port={Port};Database={DatabaseName};Username=tutorhub;Password={Password}";

    private static string GetTestDatabaseName()
    {
        var name = Environment.GetEnvironmentVariable("POSTGRES_TEST_DATABASE") ?? "tutorhub_integration";
        if (!Regex.IsMatch(name, @"^tutorhub_integration(?:_[a-z0-9_]+)?$", RegexOptions.CultureInvariant))
        {
            throw new InvalidOperationException("POSTGRES_TEST_DATABASE must start with tutorhub_integration and contain only lowercase letters, digits, or underscores.");
        }
        return name;
    }

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
                ["ConnectionStrings:DefaultConnection"] = IntegrationConnectionString,
                ["PlatformFeeRate"] = "0.10",
                ["Jwt:Secret"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)),
                ["RefreshToken:Pepper"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)),
                ["VnPay:TmnCode"] = "TESTTMN",
                ["VnPay:HashSecret"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)),
                ["VnPay:ReturnUrl"] = "http://localhost:5173/payment/return",
                ["CloudflareR2:AccountId"] = "integration-test",
                ["CloudflareR2:BucketName"] = "integration-test",
                ["CloudflareR2:AccessKeyId"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)),
                ["CloudflareR2:SecretAccessKey"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32))
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

            services.RemoveAll<IObjectStorageService>();
            services.AddSingleton<IObjectStorageService, TestObjectStorageService>();
        });
    }

    /// <summary>
    /// Recreates the dedicated integration database and applies all migrations.
    /// The strict name allow-list makes the destructive reset impossible to run
    /// against the development or production database. Runs once per test process.
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
                $"Host=localhost;Port={Port};Database=postgres;Username=tutorhub;Password={Password}";
            NpgsqlConnection.ClearAllPools();
            using (var conn = new NpgsqlConnection(maintenanceCs))
            {
                conn.Open();
                using var reset = conn.CreateCommand();
                reset.CommandText = $"DROP DATABASE IF EXISTS \"{DatabaseName}\" WITH (FORCE); CREATE DATABASE \"{DatabaseName}\"";
                reset.ExecuteNonQuery();
            }

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(
                    IntegrationConnectionString,
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
