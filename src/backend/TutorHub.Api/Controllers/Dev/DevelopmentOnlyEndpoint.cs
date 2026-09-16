namespace TutorHub.Api.Controllers.Dev;

/// <summary>
/// Marks a controller that may only be discovered in the Development environment.
/// Registration is enforced by
/// <see cref="Configuration.DevelopmentOnlyControllerFeatureProvider"/>, so the route
/// does not exist at all outside Development rather than relying on a runtime check.
/// </summary>
public interface IDevelopmentOnlyEndpoint
{
}

/// <summary>P0 dev-tooling: the single rule deciding whether a controller is exposed.</summary>
public static class DevelopmentOnlyEndpoints
{
    public static bool IsAvailable(Type controllerType, IHostEnvironment environment)
    {
        return environment.IsDevelopment()
               || !typeof(IDevelopmentOnlyEndpoint).IsAssignableFrom(controllerType);
    }
}
