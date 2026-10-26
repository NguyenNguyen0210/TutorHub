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
/// Redis backplane is always configured for SignalR.
/// These tests never touch the network: registration is asserted via service
/// descriptors and the parsed options, never by connecting.
/// </summary>
public class SignalRBackplaneRegistrationTests
{
    private static ServiceCollection BuildServices()
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456",
            ["Redis:Enabled"] = "true",
            ["Redis:ConnectionString"] = "localhost:6379"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddInfrastructure(configuration, new StubHostEnvironment());

        return services;
    }

    [Fact]
    public void RegistersRedisBackplaneAsEffectiveLifetimeManager()
    {
        var services = BuildServices();

        var managers = services
            .Where(d => d.ServiceType == typeof(HubLifetimeManager<>))
            .ToList();

        managers.Should().Contain(d =>
            d.ImplementationType == typeof(Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisHubLifetimeManager<>));
        managers.Last().ImplementationType
            .Should().Be(typeof(Microsoft.AspNetCore.SignalR.StackExchangeRedis.RedisHubLifetimeManager<>));
    }

    [Fact]
    public void ConfiguresChannelPrefixAndKeepsConnectingInBackground()
    {
        var services = BuildServices();
        using var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<SignalRRedisOptions>>().Value;

        options.Configuration.ChannelPrefix.ToString().Should().Be("TutorHub");
        options.Configuration.AbortOnConnectFail.Should().BeFalse();
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "TutorHub.Infrastructure.UnitTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
