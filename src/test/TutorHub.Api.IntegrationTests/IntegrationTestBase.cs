using MediatR;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// Base for handler-level integration tests: resolves MediatR + a fresh
/// scoped DbContext from the factory. Each test seeds uniquely-identified
/// rows (Guids), so no cleanup is required between runs.
/// </summary>
public abstract class IntegrationTestBase : IClassFixture<IntegrationWebApplicationFactory>, IDisposable
{
    protected readonly IntegrationWebApplicationFactory Factory;
    protected readonly IServiceScope Scope;
    protected readonly AppDbContext Db;
    protected readonly ISender Sender;

    protected IntegrationTestBase(IntegrationWebApplicationFactory factory)
    {
        IntegrationWebApplicationFactory.EnsureDatabase();
        Factory = factory;
        Scope = factory.Services.CreateScope();
        var provider = Scope.ServiceProvider;
        Db = provider.GetRequiredService<AppDbContext>();
        Sender = provider.GetRequiredService<ISender>();
    }

    /// <summary>
    /// Sends a request in a FRESH scope, mirroring production where each HTTP
    /// request gets its own scope. Never reuse <see cref="Sender"/> across
    /// calls: sharing one scoped DbContext between sends causes cross-talk
    /// (stale tracked entities, phantom relationship fixups) that cannot
    /// happen in production.
    /// </summary>
    protected async Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request)
    {
        using var scope = Factory.Services.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        return await sender.Send(request);
    }

    public void Dispose()
    {
        Scope.Dispose();
        GC.SuppressFinalize(this);
    }
}
