using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Infrastructure.Services;
using TutorHub.Infrastructure.Services.Email;
using Xunit;

namespace TutorHub.Infrastructure.UnitTests.Email;

/// <summary>
/// Picking the email transport is a startup decision, not a runtime one.
/// Development may run without SMTP (log-only fallback); every other environment
/// must configure SMTP or the application refuses to start, so
/// production can never silently drop notification email.
/// </summary>
public class EmailSenderRegistrationTests
{
    private static ServiceProvider BuildProvider(string environmentName, string? host, string? fromAddress)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456"
        };

        if (host is not null && fromAddress is not null)
        {
            settings["Smtp:Host"] = host;
            settings["Smtp:Port"] = "587";
            settings["Smtp:FromAddress"] = fromAddress;
            settings["Smtp:FromDisplayName"] = "TutorHub";
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        // A real host registers IConfiguration in the container; BindConfiguration relies on it.
        services.AddSingleton<IConfiguration>(configuration);
        services.AddInfrastructure(configuration, new StubHostEnvironment(environmentName));

        return services.BuildServiceProvider();
    }

    [Fact]
    public void WithoutSenderInDevelopment_RegistersLogOnlySender()
    {
        using var provider = BuildProvider(Environments.Development, host: null, fromAddress: null);
        using var scope = provider.CreateScope();

        scope.ServiceProvider.GetRequiredService<IEmailSender>()
            .Should().BeOfType<LogOnlyEmailSender>();
    }

    [Fact]
    public void WithSender_RegistersMailKitEmailSender()
    {
        using var provider = BuildProvider(Environments.Production, host: "smtp.example.com", fromAddress: "noreply@tutorhub.test");
        using var scope = provider.CreateScope();

        scope.ServiceProvider.GetRequiredService<IEmailSender>()
            .Should().BeOfType<MailKitEmailSender>();
    }

    [Fact]
    public void WithoutSenderOutsideDevelopment_RefusesToStart()
    {
        Action act = () => BuildProvider(Environments.Production, host: null, fromAddress: null);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Smtp:Host*");
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public StubHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "TutorHub.Infrastructure.UnitTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
