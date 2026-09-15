using FluentAssertions;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TutorHub.Api.Controllers.Dev;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0 dev-tooling: the development payment simulator must be impossible to reach
/// outside Development. Discovery (not a runtime attribute) is what enforces it, so
/// this pins that rule directly.
/// </summary>
public class DevelopmentOnlyEndpointsTests
{
    [Fact]
    public void DevelopmentOnlyController_IsAvailableInDevelopment()
    {
        DevelopmentOnlyEndpoints
            .IsAvailable(typeof(DevPaymentSimulatorController), Environment(Environments.Development))
            .Should().BeTrue();
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public void DevelopmentOnlyController_IsHiddenOutsideDevelopment(string environmentName)
    {
        DevelopmentOnlyEndpoints
            .IsAvailable(typeof(DevPaymentSimulatorController), Environment(environmentName))
            .Should().BeFalse();
    }

    [Fact]
    public void OrdinaryController_IsUnaffectedOutsideDevelopment()
    {
        DevelopmentOnlyEndpoints
            .IsAvailable(typeof(TutorHub.Api.Controllers.AuthController), Environment(Environments.Production))
            .Should().BeTrue();
    }

    private static IHostEnvironment Environment(string name) => new StubHostEnvironment(name);

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
}
