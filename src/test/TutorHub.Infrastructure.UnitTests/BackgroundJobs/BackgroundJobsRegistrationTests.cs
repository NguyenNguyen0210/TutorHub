using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TutorHub.Infrastructure.BackgroundServices;

namespace TutorHub.Infrastructure.UnitTests.BackgroundJobs;

/// <summary>
/// Phase 3 Task 1: the 6 background jobs are gated behind
/// <c>BackgroundJobs:Enabled</c> (default true) so a standalone
/// <c>TutorHub.Worker</c> can own them while API replicas scale job-free.
/// </summary>
public class BackgroundJobsRegistrationTests
{
    private static readonly Type[] JobTypes =
    [
        typeof(BookingTimeoutBackgroundService),
        typeof(OutboxDispatcherJob),
        typeof(EmailDeliveryJob),
        typeof(SessionReminderJob),
        typeof(GracePeriodReminderJob),
        typeof(AutoPayoutJob),
    ];

    private static ServiceCollection BuildServices(string? flagValue)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456",
        };

        if (flagValue is not null)
        {
            settings["BackgroundJobs:Enabled"] = flagValue;
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        // A real host registers IConfiguration in the container; BindConfiguration relies on it.
        services.AddSingleton<IConfiguration>(configuration);
        services.AddInfrastructure(configuration, new StubHostEnvironment());

        return services;
    }

    private static IEnumerable<Type?> RegisteredJobImplementations(ServiceCollection services)
        => services
            .Where(d => d.ServiceType == typeof(IHostedService))
            .Select(d => d.ImplementationType);

    [Fact]
    public void FlagUnset_RegistersAllSixJobs()
    {
        var services = BuildServices(flagValue: null);

        RegisteredJobImplementations(services).Should().BeEquivalentTo(JobTypes);
    }

    [Fact]
    public void FlagTrue_RegistersAllSixJobs()
    {
        var services = BuildServices(flagValue: "true");

        RegisteredJobImplementations(services).Should().BeEquivalentTo(JobTypes);
    }

    [Fact]
    public void FlagFalse_RegistersNoneOfTheSixJobs()
    {
        var services = BuildServices(flagValue: "false");

        RegisteredJobImplementations(services).Should().NotIntersectWith(JobTypes);
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "TutorHub.Infrastructure.UnitTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
