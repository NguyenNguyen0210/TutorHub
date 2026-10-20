using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TutorHub.Application;

namespace TutorHub.Infrastructure.Configuration;

/// <summary>
/// Phase 3 WP8: the shared job-host composition. Called by
/// <c>TutorHub.Worker/Program.cs</c> and invoked directly by
/// <c>WorkerBootTests</c>, so the test exercises the real composition
/// instead of a copy of it.
/// </summary>
public static class WorkerComposition
{
    public static IServiceCollection AddWorkerComposition(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // CurrentUserService (registered inside AddInfrastructure) needs the accessor;
        // a job host has no HTTP context, so it simply resolves to null here.
        services.AddHttpContextAccessor();
        services.AddApplication();
        services.AddInfrastructure(configuration, environment);

        return services;
    }
}
