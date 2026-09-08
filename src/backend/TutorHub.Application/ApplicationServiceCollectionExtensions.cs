using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Behaviors;

namespace TutorHub.Application;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        // NOTE: AuthTokenLifetimeOptions is bound in TutorHub.Api/Program.cs
        // (composition root) to avoid an Options.ConfigurationExtensions
        // dependency in the Application layer.

        return services;
    }
}
