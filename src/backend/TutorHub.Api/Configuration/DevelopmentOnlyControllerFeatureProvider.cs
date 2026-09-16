using System.Reflection;
using Microsoft.AspNetCore.Mvc.Controllers;
using TutorHub.Api.Controllers.Dev;

namespace TutorHub.Api.Configuration;

/// <summary>
/// P0 dev-tooling: replaces the default <see cref="ControllerFeatureProvider"/> so
/// <see cref="IDevelopmentOnlyEndpoint"/> controllers are never discovered outside
/// Development. Because the type is absent from the application part, the route simply
/// does not exist (404) — a dev-only tool cannot be reached in production even if a
/// future refactor forgets an authorization attribute.
/// </summary>
public sealed class DevelopmentOnlyControllerFeatureProvider : ControllerFeatureProvider
{
    private readonly IHostEnvironment _environment;

    public DevelopmentOnlyControllerFeatureProvider(IHostEnvironment environment)
    {
        _environment = environment;
    }

    protected override bool IsController(TypeInfo typeInfo)
    {
        return base.IsController(typeInfo)
               && DevelopmentOnlyEndpoints.IsAvailable(typeInfo.AsType(), _environment);
    }
}
