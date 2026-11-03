using Microsoft.Extensions.Configuration;
using Npgsql;

namespace TutorHub.Infrastructure.Configuration;

/// <summary>
/// Accepts Neon/hosting PostgreSQL URLs while preserving the existing .NET
/// connection string configuration used by local Docker and production stacks.
/// </summary>
public static class NeonPostgresConnection
{
    public static string? Resolve(IConfiguration configuration)
    {
        var configured = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        var databaseUrl = configuration["DATABASE_URL"];
        if (string.IsNullOrWhiteSpace(databaseUrl))
        {
            return configured;
        }

        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri)
            || (uri.Scheme != "postgres" && uri.Scheme != "postgresql")
            || uri.UserInfo.Split(':', 2) is not [var username, var password]
            || string.IsNullOrWhiteSpace(uri.Host)
            || string.IsNullOrWhiteSpace(uri.AbsolutePath.Trim('/')))
        {
            throw new InvalidOperationException("DATABASE_URL must be a PostgreSQL connection URL with credentials and a database name.");
        }

        // Neon connections require TLS. The connection string builder escapes
        // reserved characters in passwords and usernames correctly for Npgsql.
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(username),
            Password = Uri.UnescapeDataString(password),
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }
}
