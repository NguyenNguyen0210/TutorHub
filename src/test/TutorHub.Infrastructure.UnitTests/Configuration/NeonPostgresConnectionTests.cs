using Microsoft.Extensions.Configuration;
using Npgsql;
using TutorHub.Infrastructure.Configuration;

namespace TutorHub.Infrastructure.UnitTests.Configuration;

public class NeonPostgresConnectionTests
{
    [Fact]
    public void Resolve_PrefersExistingDotNetConnectionString()
    {
        var config = Config(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=tutorhub",
            ["DATABASE_URL"] = "postgresql://user:pass@neon.example/tutorhub_db"
        });

        Assert.Equal("Host=localhost;Database=tutorhub", NeonPostgresConnection.Resolve(config));
    }

    [Fact]
    public void Resolve_ConvertsNeonUrlAndPreservesEncodedCredentials()
    {
        var config = Config(new Dictionary<string, string?>
        {
            ["DATABASE_URL"] = "postgresql://some%40user:p%40ss%3Bword@ep-example.neon.tech/tutorhub_db?sslmode=require"
        });

        var connection = new NpgsqlConnectionStringBuilder(NeonPostgresConnection.Resolve(config));

        Assert.Equal("ep-example.neon.tech", connection.Host);
        Assert.Equal(5432, connection.Port);
        Assert.Equal("tutorhub_db", connection.Database);
        Assert.Equal("some@user", connection.Username);
        Assert.Equal("p@ss;word", connection.Password);
        Assert.Equal(SslMode.Require, connection.SslMode);
    }

    [Fact]
    public void Resolve_RejectsNonPostgresUrl()
    {
        var config = Config(new Dictionary<string, string?>
        {
            ["DATABASE_URL"] = "https://example.com/db"
        });

        Assert.Throws<InvalidOperationException>(() => NeonPostgresConnection.Resolve(config));
    }

    private static IConfiguration Config(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();
}
