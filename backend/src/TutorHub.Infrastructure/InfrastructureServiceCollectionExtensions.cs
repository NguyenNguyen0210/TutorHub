using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // JWT Options Pattern Configuration
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        // Authentication & Security Services
        services.AddSingleton<IJwtService, JwtService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // VNPay Payment Gateway Services
        services.Configure<Services.VnPay.VnPayOptions>(configuration.GetSection(Services.VnPay.VnPayOptions.SectionName));
        services.AddScoped<IVnPayService, Services.VnPay.VnPayService>();

        // Cloudflare R2 Object Storage Services
        services.Configure<Services.Storage.CloudflareR2Options>(configuration.GetSection(Services.Storage.CloudflareR2Options.SectionName));
        services.AddScoped<IStorageService, Services.Storage.CloudflareR2StorageService>();

        // Background Workers
        services.AddHostedService<BookingTimeoutBackgroundService>();

        return services;
    }
}
