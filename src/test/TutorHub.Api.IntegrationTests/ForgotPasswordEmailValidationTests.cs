using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace TutorHub.Api.IntegrationTests;

public class ForgotPasswordEmailValidationTests : IntegrationTestBase
{
    public ForgotPasswordEmailValidationTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("owner@example")]
    [InlineData("owner@example..com")]
    public async Task InvalidEmail_ReturnsBadRequestInsteadOfContinuingToOtp(string email)
    {
        using var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(body.GetProperty("success").GetBoolean());
    }

    [Fact]
    public async Task UnknownEmail_ReturnsExplicitRegistrationError()
    {
        using var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email = $"unregistered-{Guid.NewGuid():N}@example.com" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(body.GetProperty("success").GetBoolean());
        Assert.Contains(body.GetProperty("errors").EnumerateArray(), error => error.GetString() == "Email này chưa được đăng ký trên TutorHub.");
    }
}
