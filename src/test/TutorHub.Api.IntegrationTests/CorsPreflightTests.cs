using System.Net;
using FluentAssertions;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-E2: the CORS policy lives in the middleware pipeline, so it must be proven
/// over HTTP — resolving the origin list correctly is not enough.
///
/// The test host runs in Development, which defaults to the local Vite origins,
/// so http://localhost:5173 is the allowed origin under test.
/// </summary>
public class CorsPreflightTests : IntegrationTestBase
{
    private const string AllowedOrigin = "http://localhost:5173";

    public CorsPreflightTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Preflight_FromAnAllowedOrigin_IsAcceptedWithCredentials()
    {
        using var client = Factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/auth/login");
        request.Headers.Add("Origin", AllowedOrigin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        using var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Contain(AllowedOrigin);
        response.Headers.GetValues("Access-Control-Allow-Credentials").Should().Contain("true");
        response.Headers.GetValues("Access-Control-Allow-Headers")
            .Should().Contain(value => value.Contains("content-type", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Preflight_FromADisallowedOrigin_GetsNoCorsGrant()
    {
        using var client = Factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/auth/login");
        request.Headers.Add("Origin", "https://evil.example.com");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        using var response = await client.SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
        response.Headers.Contains("Access-Control-Allow-Credentials").Should().BeFalse();
    }

    [Fact]
    public async Task ActualRequest_FromAnAllowedOrigin_ExposesTheCorrelationId()
    {
        using var client = Factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("Origin", AllowedOrigin);

        using var response = await client.SendAsync(request);

        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Contain(AllowedOrigin);
        response.Headers.GetValues("Access-Control-Expose-Headers")
            .Should().Contain(value => value.Contains("X-Correlation-ID", StringComparison.OrdinalIgnoreCase));
    }
}
