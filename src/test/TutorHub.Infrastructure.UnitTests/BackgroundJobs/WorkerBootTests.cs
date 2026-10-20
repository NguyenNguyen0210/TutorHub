using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Configuration;

namespace TutorHub.Infrastructure.UnitTests.BackgroundJobs;

/// <summary>
/// Phase 3 Task 1: the Worker composition (generic host +
/// <c>AddApplication()</c> + <c>AddInfrastructure()</c>) builds and honours
/// the <c>BackgroundJobs:Enabled</c> flag, without any web-only services.
/// </summary>
public class WorkerBootTests
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

    private static IHost BuildWorkerHost(string? flagValue)
    {
        var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
        {
            EnvironmentName = Environments.Development,
        });

        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456",
        };

        if (flagValue is not null)
        {
            settings["BackgroundJobs:Enabled"] = flagValue;
        }

        builder.Configuration.AddInMemoryCollection(settings);

        // The real Worker composition (same method TutorHub.Worker/Program.cs calls).
        builder.Services.AddWorkerComposition(builder.Configuration, builder.Environment);

        return builder.Build();
    }

    private static IEnumerable<Type?> HostedJobImplementations(IHost host)
        => host.Services.GetServices<IHostedService>().Select(s => s.GetType());

    [Fact]
    public void WorkerHost_Builds_WithJobsEnabledByDefault()
    {
        using var host = BuildWorkerHost(flagValue: null);

        host.Should().NotBeNull();
        HostedJobImplementations(host).Should().BeEquivalentTo(JobTypes);
    }

    [Fact]
    public void WorkerHost_Builds_WithNoJobsWhenFlagFalse()
    {
        using var host = BuildWorkerHost(flagValue: "false");

        host.Should().NotBeNull();
        HostedJobImplementations(host).Should().BeEmpty();
    }

    [Fact]
    public void WorkerAppSettings_TrimmedFile_ParsesAndHostBuilds()
    {
        // M1: the trimmed TutorHub.Worker/appsettings.json must still boot the
        // host through the real composition (empty values are fine — nothing
        // connects or validates until Start).
        var workerSettings = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "..",
            "backend", "TutorHub.Worker", "appsettings.json"));

        File.Exists(workerSettings).Should().BeTrue("the Worker appsettings.json ships with the repo");

        var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
        {
            EnvironmentName = Environments.Development,
        });
        builder.Configuration.AddJsonFile(workerSettings, optional: false, reloadOnChange: false);
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456",
        });

        builder.Services.AddWorkerComposition(builder.Configuration, builder.Environment);
        using var host = builder.Build();

        host.Should().NotBeNull();
        HostedJobImplementations(host).Should().BeEquivalentTo(JobTypes);
    }
}
