using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TutorHub.Api.Configuration;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-E2: the API allows credentialed cross-origin calls, so the origin list must
/// be explicit (never a wildcard) and must exist outside Development, where an
/// empty policy would leave the deployed frontend unable to call the API at all.
/// </summary>
public class CorsOriginsTests
{
    private static IConfiguration BuildConfig(params (string Key, string? Value)[] values)
    {
        var dict = new Dictionary<string, string?>();
        foreach (var (key, value) in values)
        {
            dict[key] = value;
        }

        return new ConfigurationBuilder().AddInMemoryCollection(dict).Build();
    }

    private static IHostEnvironment Environment(string name) =>
        new StubHostEnvironment(name);

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public StubHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "TutorHub.Api.IntegrationTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    [Fact]
    public void Resolve_DevelopmentWithoutConfiguration_UsesLocalFrontendDefaults()
    {
        var origins = CorsOrigins.Resolve(BuildConfig(), Environment(Environments.Development));

        // The fallback exists so a local SPA can always reach the API. Which localhost
        // port a developer's tooling binds is not the API's business, so assert the
        // canonical Vite ports without pinning the exact list.
        origins.Should().Contain("http://localhost:5173");
        origins.Should().Contain("http://localhost:4173");
        origins.Should().OnlyContain(origin => origin.StartsWith("http://localhost:", StringComparison.Ordinal));
    }

    [Fact]
    public void Resolve_OutsideDevelopmentWithoutOrigins_Throws()
    {
        Action act = () => CorsOrigins.Resolve(BuildConfig(), Environment(Environments.Production));

        act.Should().Throw<InvalidOperationException>().WithMessage("*Cors:AllowedOrigins*");
    }

    [Fact]
    public void Resolve_OutsideDevelopmentWithBlankEntriesOnly_Throws()
    {
        var config = BuildConfig(("Cors:AllowedOrigins", "   "));

        Action act = () => CorsOrigins.Resolve(config, Environment(Environments.Production));

        act.Should().Throw<InvalidOperationException>().WithMessage("*Cors:AllowedOrigins*");
    }

    [Fact]
    public void Resolve_WithIndexedOrigins_ReadsEveryEntry()
    {
        var config = BuildConfig(
            ("Cors:AllowedOrigins:0", "https://app.tutorhub.test"),
            ("Cors:AllowedOrigins:1", "https://admin.tutorhub.test"));

        var origins = CorsOrigins.Resolve(config, Environment(Environments.Production));

        origins.Should().Equal("https://app.tutorhub.test", "https://admin.tutorhub.test");
    }

    [Fact]
    public void Resolve_WithCommaSeparatedOrigins_SplitsEveryOrigin()
    {
        // This is the shape docker-compose passes through from .env.
        var config = BuildConfig(
            ("Cors:AllowedOrigins", "https://app.tutorhub.test,https://admin.tutorhub.test"));

        var origins = CorsOrigins.Resolve(config, Environment(Environments.Production));

        origins.Should().Equal("https://app.tutorhub.test", "https://admin.tutorhub.test");
    }

    [Fact]
    public void Resolve_WithWildcard_Throws()
    {
        var config = BuildConfig(("Cors:AllowedOrigins", "*"));

        Action act = () => CorsOrigins.Resolve(config, Environment(Environments.Production));

        act.Should().Throw<InvalidOperationException>().WithMessage("*wildcard*");
    }

    [Fact]
    public void Resolve_TrimsOriginsAndDropsBlanks()
    {
        var config = BuildConfig(
            ("Cors:AllowedOrigins:0", "  https://app.tutorhub.test  "),
            ("Cors:AllowedOrigins:1", ""),
            ("Cors:AllowedOrigins:2", "https://admin.tutorhub.test"));

        var origins = CorsOrigins.Resolve(config, Environment(Environments.Production));

        origins.Should().Equal("https://app.tutorhub.test", "https://admin.tutorhub.test");
    }
}
