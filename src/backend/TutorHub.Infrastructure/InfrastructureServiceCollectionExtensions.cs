using Amazon.Runtime;
using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Storage;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Persistence;
using TutorHub.Infrastructure.Services;
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

        // Auth token lifetimes (F-06): same "Jwt" section, consumed by
        // Login/RefreshToken handlers so persisted expiries match signing.
        services.AddOptions<AuthTokenLifetimeOptions>()
            .BindConfiguration(AuthTokenLifetimeOptions.SectionName)
            .ValidateOnStart();

        // Refresh token hashing pepper (P0-D1). Required: tokens are stored hashed,
        // and the pepper must never live in the database alongside them.
        services.AddOptions<RefreshTokenOptions>()
            .BindConfiguration(RefreshTokenOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Authentication & Security Services
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IJwtService, JwtService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IRefreshTokenHasher, RefreshTokenHasher>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // VNPay Payment Gateway Services
        services.AddOptions<VnPayOptions>()
            .BindConfiguration(VnPayOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddScoped<IPaymentGateway, VnPayPaymentGateway>();

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
        services.AddScoped<IFileStorage, LocalFileStorage>();
        services.AddScoped<IEmailSender, LogOnlyEmailSender>();
        services.AddScoped<INotificationService, SignalRNotificationService>();
        services.AddScoped<IChatNotificationService, SignalRChatNotificationService>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        services.AddSignalR();

        // Background Workers
        services.AddHostedService<BookingTimeoutBackgroundService>();
        services.AddHostedService<OutboxDispatcherJob>();
        services.AddHostedService<EmailDeliveryJob>();
        services.AddHostedService<SessionReminderJob>();
        services.AddHostedService<AttendanceReminderJob>();
        services.AddHostedService<AttendanceVerificationJob>();

        return services;
    }
}
