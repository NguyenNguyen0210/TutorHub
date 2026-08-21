using Amazon.Runtime;
using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payment;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Storage;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Persistence;
using TutorHub.Infrastructure.Services.Storage;
using TutorHub.Infrastructure.Services.VnPay;

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
        services.AddOptions<JwtOptions>()
            .BindConfiguration(JwtOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Authentication & Security Services
        services.AddSingleton<IJwtService, JwtService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // VNPay Payment Gateway Services
        services.AddOptions<VnPayOptions>()
            .BindConfiguration(VnPayOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddScoped<IVnPayService, VnPayService>();

        // Cloudflare R2 Object Storage Services
        services.AddOptions<CloudflareR2Options>()
            .BindConfiguration(CloudflareR2Options.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IAmazonS3>(sp =>
        {
            var r2Options = sp.GetRequiredService<IOptions<CloudflareR2Options>>().Value;

            var config = new AmazonS3Config
            {
                ServiceURL = r2Options.ServiceUrl,
                ForcePathStyle = true,
                AuthenticationRegion = "auto"
            };

            var credentials = new BasicAWSCredentials(r2Options.AccessKeyId, r2Options.SecretAccessKey);
            return new AmazonS3Client(credentials, config);
        });

        services.AddScoped<IObjectStorageService, CloudflareR2ObjectStorageService>();

        // Background Workers
        services.AddHostedService<BookingTimeoutBackgroundService>();

        return services;
    }
}
