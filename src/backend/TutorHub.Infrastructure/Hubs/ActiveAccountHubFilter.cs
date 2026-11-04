using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Hubs;

/// <summary>Revalidates established connections, including clients that only receive messages.</summary>
public sealed class ActiveAccountHubFilter(
    IServiceScopeFactory scopes, TimeProvider timeProvider, ILogger<ActiveAccountHubFilter> logger) : IHubFilter
{
    public static readonly TimeSpan RevalidationInterval = TimeSpan.FromSeconds(5);
    private static readonly object MonitorKey = new();
    private sealed record MonitorState(CancellationTokenSource Cancellation, Task Task);

    public async ValueTask<object?> InvokeMethodAsync(HubInvocationContext context,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        if (!await IsActiveAsync(context.Context.User, context.Context.ConnectionAborted))
        {
            context.Context.Abort();
            throw new HubException("This connection is no longer authorized. Please sign in again.");
        }
        return await next(context);
    }

    public async Task OnConnectedAsync(HubLifetimeContext context, Func<HubLifetimeContext, Task> next)
    {
        if (!await IsActiveAsync(context.Context.User, context.Context.ConnectionAborted))
        {
            context.Context.Abort();
            throw new HubException("This connection is no longer authorized.");
        }
        var cancellation = CancellationTokenSource.CreateLinkedTokenSource(context.Context.ConnectionAborted);
        var monitor = new MonitorState(cancellation, MonitorAsync(context.Context, cancellation.Token));
        context.Context.Items[MonitorKey] = monitor;
        try { await next(context); }
        catch
        {
            cancellation.Cancel();
            await monitor.Task;
            cancellation.Dispose();
            context.Context.Items.Remove(MonitorKey);
            throw;
        }
    }

    public async Task OnDisconnectedAsync(HubLifetimeContext context, Exception? exception,
        Func<HubLifetimeContext, Exception?, Task> next)
    {
        if (context.Context.Items.Remove(MonitorKey, out var value) && value is MonitorState monitor)
        {
            monitor.Cancellation.Cancel();
            await monitor.Task;
            monitor.Cancellation.Dispose();
        }
        await next(context, exception);
    }

    private async Task MonitorAsync(HubCallerContext context, CancellationToken cancellationToken)
    {
        try
        {
            using var timer = new PeriodicTimer(RevalidationInterval, timeProvider);
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                if (await IsActiveAsync(context.User, cancellationToken)) continue;
                context.Abort();
                return;
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Cannot revalidate realtime connection {ConnectionId}; closing it", context.ConnectionId);
            context.Abort();
        }
    }

    private async Task<bool> IsActiveAsync(ClaimsPrincipal? principal, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId)
            || !int.TryParse(principal.FindFirst("token_version")?.Value, out var version)
            || !long.TryParse(principal.FindFirst("exp")?.Value, out var expiry)
            || timeProvider.GetUtcNow().ToUnixTimeSeconds() >= expiry)
            return false;
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        return await db.Users.AsNoTracking().AnyAsync(user => user.Id == userId
            && user.Status == AccountStatus.Active && user.TokenVersion == version, cancellationToken);
    }
}
