namespace TutorHub.Api.Configuration;

/// <summary>
/// P0-E2: resolves which browser origins may call the API.
///
/// Credentials are allowed (the SPA sends the auth cookie/header), so the origin
/// list can never be a wildcard. Development falls back to the local frontend
/// dev/preview ports; every other environment must state its origins explicitly
/// or the deployment stops, because a silently empty CORS policy means the
/// frontend cannot talk to the API at all.
/// </summary>
public static class CorsOrigins
{
    /// <summary>Vite dev server (:5173) and `vite preview` (:4173).</summary>
    private static readonly string[] DevelopmentDefaults =
    {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4173"
    };

    public static string[] Resolve(IConfiguration configuration, IHostEnvironment environment)
    {
        var section = configuration.GetSection("Cors:AllowedOrigins");

        // Two shapes are accepted, because the deployment surfaces differ:
        //   * array       — JSON array in appsettings, or Cors__AllowedOrigins__0/__1
        //   * single value — Cors__AllowedOrigins=a,b, which is what docker-compose
        //                    can pass through from .env (the binder alone does not
        //                    split a scalar into an array).
        var rawValue = section.Value;
        var rawEntries = rawValue is not null
            ? new[] { rawValue }
            : section.GetChildren()
                .Select(child => child.Value)
                .Where(value => value is not null)
                .Select(value => value!)
                .ToArray();

        var origins = rawEntries
            .SelectMany(entry => entry.Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .ToArray();

        if (origins.Contains("*"))
        {
            throw new InvalidOperationException(
                "Cors:AllowedOrigins must list explicit origins: a wildcard cannot be combined " +
                "with AllowCredentials, which this API requires.");
        }

        if (origins.Length == 0)
        {
            if (environment.IsDevelopment())
            {
                return DevelopmentDefaults;
            }

            throw new InvalidOperationException(
                "Cors:AllowedOrigins must list at least one frontend origin outside Development; " +
                "an empty policy would make the deployed frontend unable to call the API.");
        }

        return origins;
    }
}
