namespace TutorHub.Application.Common.Models;

/// <summary>
/// Credentials for one external identity provider. A provider whose
/// <see cref="ClientId"/> or <see cref="ClientSecret"/> is blank is treated as
/// "not switched on" and never called — see <see cref="Enabled"/>.
/// </summary>
public class ExternalAuthProviderOptions
{
    public const string SectionName = "ExternalAuth";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>Space-separated scopes to request from this provider.</summary>
    public string Scopes { get; set; } = string.Empty;

    /// <summary>
    /// False unless BOTH client id and client secret are present. Deliberately
    /// computed rather than configured: a half-configured provider must be treated
    /// as off, because calling Google with a client id and no secret produces an
    /// error message that tells the user nothing.
    /// </summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);
}

/// <summary>Root options for external sign-in, bound from the ExternalAuth section.</summary>
public class ExternalAuthOptions
{
    public const string SectionName = ExternalAuthProviderOptions.SectionName;

    public ExternalAuthProviderOptions Google { get; set; } = new();
    public ExternalAuthProviderOptions Facebook { get; set; } = new();

    /// <summary>
    /// Where the provider sends the browser back to. This is the FRONTEND URL
    /// (the SPA callback route), not an API URL — the API deliberately does not
    /// accept the callback over GET.
    /// </summary>
    public string RedirectUri { get; set; } = string.Empty;

    /// <summary>How long an unused authorization `state` stays valid.</summary>
    public int StateLifetimeMinutes { get; set; } = 10;
}
