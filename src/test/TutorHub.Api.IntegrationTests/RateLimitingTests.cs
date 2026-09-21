using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-D2: the credential endpoints must actually be throttled, and the rejection must
/// keep the documented ApiResponse envelope so clients can parse it like any other error.
///
/// This is deliberately an HTTP-level test: rate limiting lives in the middleware
/// pipeline, so dispatching through MediatR (as the other integration tests do) would
/// not exercise it at all.
/// </summary>
public class RateLimitingTests : IntegrationTestBase
{
    /// <summary>Mirrors RateLimitingSetup.AuthPermitLimit for the auth-strict policy.</summary>
    private const int AuthPermitLimit = 10;

    public RateLimitingTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Login_AfterThePermitLimit_ReturnsThrottledEnvelope()
    {
        using var client = Factory.CreateClient();
        var payload = new { email = "throttle-probe@test.local", password = "WrongPassword123!" };

        // Under the limit: the request reaches the handler and fails on credentials.
        for (var i = 0; i < AuthPermitLimit; i++)
        {
            using var allowed = await client.PostAsJsonAsync("/api/v1/auth/login", payload);
            allowed.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
                "attempt {0} is within the permit limit and must reach the handler", i + 1);
        }

        // Over the limit: throttled before the handler runs.
        using var throttled = await client.PostAsJsonAsync("/api/v1/auth/login", payload);

        throttled.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        throttled.Headers.RetryAfter.Should().NotBeNull();

        var body = await throttled.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(body);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeFalse();
        document.RootElement.GetProperty("message").GetString().Should().Contain("Too many requests");
    }
}
