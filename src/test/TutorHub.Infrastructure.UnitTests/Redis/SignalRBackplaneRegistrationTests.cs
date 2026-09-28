using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TutorHub.Infrastructure;
using SignalRRedisOptions = Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisOptions;

namespace TutorHub.Infrastructure.UnitTests.Redis;

/// <summary>
/// WP2: the SignalR Redis backplane is a startup wiring decision. Flag on registers
/// the Redis lifetime manager with the TutorHub channel prefix and abortConnect=false
/// semantics; flag off (or Redis disabled) keeps the default local lifetime manager.
/// These tests never touch the network: registration is asserted via service
/// descriptors and the parsed options, never by connecting.
/// </summary>
public class SignalRBackplaneRegistrationTests
{
    private static ServiceCollection BuildServices(bool redisEnabled, bool signalRFeature)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456",
            ["Redis:Enabled"] = redisEnabled.ToString(),
            ["Redis:ConnectionString"] = "localhost:6379",
            ["Redis:Features:SignalR"] = signalRFeature.ToString()
        };

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

    [Fact]
    public void SignalRFlagOn_RegistersRedisBackplaneAsEffectiveLifetimeManager()
    {
        var services = BuildServices(redisEnabled: true, signalRFeature: true);

        var managers = services
            .Where(d => d.ServiceType == typeof(HubLifetimeManager<>))
            .ToList();

        managers.Should().Contain(d =>
            d.ImplementationType == typeof(Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisHubLifetimeManager<>));
        managers.Last().ImplementationType
            .Should().Be(typeof(Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisHubLifetimeManager<>));
    }

    [Fact]
    public void SignalRFlagOn_ConfiguresChannelPrefixAndKeepsConnectingInBackground()
    {
        var services = BuildServices(redisEnabled: true, signalRFeature: true);
        using var provider = services.BuildServiceProvider();

        // Resolving the options only runs the configure callback (pure parse of the
        // connection string). No connection is opened, so no redis is required.
        var options = provider.GetRequiredService<IOptions<SignalRRedisOptions>>().Value;

        options.Configuration.ChannelPrefix.ToString().Should().Be("TutorHub");
        // The (string, configure) overload replaces the library default options object
        // (which already has AbortOnConnectFail=false) with the parsed connection
        // string (default true). Registration must re-assert false so a down redis
        // never blocks boot and the backplane connects in the background instead.
        options.Configuration.AbortOnConnectFail.Should().BeFalse();
    }

    [Fact]
    public void SignalRFlagOff_KeepsLocalLifetimeManager()
    {
        var services = BuildServices(redisEnabled: true, signalRFeature: false);

        services.Should().NotContain(d =>
            d.ServiceType == typeof(HubLifetimeManager<>) &&
            d.ImplementationType == typeof(Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisHubLifetimeManager<>));
    }

    [Fact]
    public void RedisDisabled_KeepsLocalLifetimeManager()
    {
        var services = BuildServices(redisEnabled: false, signalRFeature: true);

        services.Should().NotContain(d =>
            d.ServiceType == typeof(HubLifetimeManager<>) &&
            d.ImplementationType == typeof(Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisHubLifetimeManager<>));
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "TutorHub.Infrastructure.UnitTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
