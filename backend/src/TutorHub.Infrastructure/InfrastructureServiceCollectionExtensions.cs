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
        services.AddSingleton<Amazon.S3.IAmazonS3>(sp =>
        {
            var r2Options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<Services.Storage.CloudflareR2Options>>().Value;

            var serviceUrl = !string.IsNullOrWhiteSpace(r2Options.ServiceUrl)
                ? r2Options.ServiceUrl
                : "https://a723aecd2d08dcca2efc3a66d27e16db.r2.cloudflarestorage.com";

            var config = new Amazon.S3.AmazonS3Config
            {
                ServiceURL = serviceUrl,
                ForcePathStyle = true,
                AuthenticationRegion = "auto"
            };

            if (!string.IsNullOrWhiteSpace(r2Options.AccessKeyId) && !string.IsNullOrWhiteSpace(r2Options.SecretAccessKey))
            {
                var credentials = new Amazon.Runtime.BasicAWSCredentials(r2Options.AccessKeyId, r2Options.SecretAccessKey);
                return new Amazon.S3.AmazonS3Client(credentials, config);
            }

            return new Amazon.S3.AmazonS3Client(new Amazon.Runtime.AnonymousAWSCredentials(), config);
        });

        services.AddScoped<IObjectStorageService, Services.Storage.CloudflareR2ObjectStorageService>();

        // Background Workers
        services.AddHostedService<BookingTimeoutBackgroundService>();

        return services;
    }
}
