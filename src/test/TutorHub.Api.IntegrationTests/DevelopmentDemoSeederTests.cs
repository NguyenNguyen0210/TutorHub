using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TutorHub.Api;

namespace TutorHub.Api.IntegrationTests;

public class DevelopmentDemoSeederTests
{
    [Fact]
    public async Task Production_refuses_demo_before_opening_a_database()
    {
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DevelopmentDemoSeeder.RunAsync(new SeedEnvironment("Production"), new ConfigurationBuilder().Build()));
        Assert.Contains("Development", error.Message);
    }

    [Theory]
    [InlineData("remote.example.com")]
    [InlineData("localhost,remote.example.com")]
    public async Task Development_refuses_remote_database(string host)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = $"Host={host};Database=demo;Username=demo;Password=demo"
        }).Build();
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DevelopmentDemoSeeder.RunAsync(new SeedEnvironment("Development"), configuration));
        Assert.Contains("local PostgreSQL", error.Message);
    }

    private sealed class SeedEnvironment(string name) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = name;
        public string ApplicationName { get; set; } = "DemoSeederTest";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
