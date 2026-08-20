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

        // AWS S3 Cloud Storage Services
        services.Configure<Services.Storage.AwsS3Options>(configuration.GetSection(Services.Storage.AwsS3Options.SectionName));
        services.AddScoped<IStorageService, Services.Storage.AwsS3StorageService>();

        // Background Workers
        services.AddHostedService<BookingTimeoutBackgroundService>();

        return services;
    }
}
