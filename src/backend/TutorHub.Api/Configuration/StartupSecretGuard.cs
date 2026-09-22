namespace TutorHub.Api.Configuration;

/// <summary>
/// F-25 hardening: refuse to start when a secret still holds a template value.
///
/// Empty values are already rejected by the options classes' <c>[Required]</c> +
/// <c>ValidateOnStart()</c>. This guard catches the other, more dangerous case: a
/// value copied from <c>.env.example</c> (or the old hard-coded docker-compose
/// default) that is long enough to satisfy length validation but is not a secret.
/// </summary>
public static class StartupSecretGuard
{
    /// <summary>Fragments that only ever appear in template/example secrets.</summary>
    private static readonly string[] ForbiddenFragments =
    {
        "your_",
        "change_me",
        "changeme",
        "placeholder",
        "super_secret"
    };

    /// <summary>Configuration keys that must never hold a template value.</summary>
    private static readonly string[] GuardedKeys =
    {
        "ConnectionStrings:DefaultConnection",
        "Jwt:Secret",
        "VnPay:HashSecret",
        "CloudflareR2:AccessKeyId",
        "CloudflareR2:SecretAccessKey"
    };

    public static void ValidateNoPlaceholderSecrets(IConfiguration configuration)
    {
        var offenders = new List<string>();

        foreach (var key in GuardedKeys)
        {
            var value = configuration[key];

            // Absence/emptiness is the options classes' job to reject.
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (ForbiddenFragments.Any(fragment =>
                    value.Contains(fragment, StringComparison.OrdinalIgnoreCase)))
            {
                offenders.Add(key);
            }
        }

        if (offenders.Count > 0)
        {
            throw new InvalidOperationException(
                "Refusing to start: these configuration values still hold placeholder secrets: " +
                string.Join(", ", offenders) +
                ". Generate real values (e.g. `openssl rand -base64 48`) and supply them through " +
                "environment variables or a local .env file.");
        }
    }
}
