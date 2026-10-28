using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Common.Concurrency;

public static class PostgresAdvisoryLock
{
    public static bool IsPostgres(IAppDbContext context) =>
        context.Database != null && string.Equals(
            context.Database.ProviderName,
            "Npgsql.EntityFrameworkCore.PostgreSQL",
            StringComparison.Ordinal);

    public static async Task<IDbContextTransaction?> BeginTransactionAsync(
        IAppDbContext context,
        CancellationToken cancellationToken)
    {
        if (context.Database == null || !context.Database.IsRelational())
            return null;

        return await context.Database.BeginTransactionAsync(cancellationToken);
    }

    public static Task LockRowAsync(
        IAppDbContext context,
        FormattableString command,
        CancellationToken cancellationToken) =>
        IsPostgres(context)
            ? context.Database.ExecuteSqlInterpolatedAsync(command, cancellationToken)
            : Task.CompletedTask;

    public static Task AcquireAsync(
        IAppDbContext context,
        string resource,
        CancellationToken cancellationToken)
    {
        if (!IsPostgres(context))
        {
            return Task.CompletedTask;
        }

        return context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtextextended({resource}, 0))",
            cancellationToken);
    }

    public static async Task AcquireManyAsync(
        IAppDbContext context,
        IEnumerable<string> resources,
        CancellationToken cancellationToken)
    {
        foreach (var resource in resources.Distinct(StringComparer.Ordinal).OrderBy(x => x, StringComparer.Ordinal))
        {
            await AcquireAsync(context, resource, cancellationToken);
        }
    }
}
