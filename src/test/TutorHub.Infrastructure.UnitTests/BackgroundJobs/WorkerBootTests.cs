using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TutorHub.Application;
using TutorHub.Infrastructure.BackgroundServices;

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

        // Same composition as TutorHub.Worker/Program.cs (which, like the Api,
        // registers the accessor itself — it lives outside AddInfrastructure).
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

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
        HostedJobImplementations(host).Should().NotIntersectWith(JobTypes);
    }
}
