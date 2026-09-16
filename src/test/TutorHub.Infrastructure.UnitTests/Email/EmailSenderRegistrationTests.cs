using Amazon.SimpleEmail;
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
/// P0-E1: picking the email transport is a startup decision, not a runtime one.
/// Development may run without SES (log-only, loudly); every other environment
/// must configure a verified sender or the application refuses to start, so
/// production can never silently drop notification email.
/// </summary>
public class EmailSenderRegistrationTests
{
    private static ServiceProvider BuildProvider(string environmentName, string? fromAddress)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456"
        };

        if (fromAddress is not null)
        {
            settings["Ses:FromAddress"] = fromAddress;
            settings["Ses:Region"] = "ap-southeast-1";
            settings["Ses:FromDisplayName"] = "TutorHub";
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
        using var provider = BuildProvider(Environments.Development, fromAddress: null);
        using var scope = provider.CreateScope();

        scope.ServiceProvider.GetRequiredService<IEmailSender>()
            .Should().BeOfType<LogOnlyEmailSender>();
    }

    [Fact]
    public void WithSender_RegistersSesSenderAndClient()
    {
        using var provider = BuildProvider(Environments.Production, fromAddress: "noreply@tutorhub.test");
        using var scope = provider.CreateScope();

        scope.ServiceProvider.GetRequiredService<IEmailSender>()
            .Should().BeOfType<SesEmailSender>();

        scope.ServiceProvider.GetRequiredService<IAmazonSimpleEmailService>()
            .Should().BeOfType<AmazonSimpleEmailServiceClient>();
    }

    [Fact]
    public void WithoutSenderOutsideDevelopment_RefusesToStart()
    {
        Action act = () => BuildProvider(Environments.Production, fromAddress: null);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Ses:FromAddress*");
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
