using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.SimpleEmail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection.Extensions;
using StackExchange.Redis;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Storage;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.Authentication.External;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Caching;
using TutorHub.Infrastructure.Distributed;
using TutorHub.Infrastructure.Persistence;
using TutorHub.Infrastructure.Redis;
using TutorHub.Infrastructure.Services;
using TutorHub.Infrastructure.Services.Email;
using TutorHub.Infrastructure.Services.Storage;
using TutorHub.Infrastructure.Services.VnPay;

namespace TutorHub.Infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
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

        // Account lockout thresholds (P0-D3).
        services.AddOptions<AuthLockoutOptions>()
            .BindConfiguration(AuthLockoutOptions.SectionName)
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

        // P0-E1: production email runs on Amazon SES. A deployment opts in by
        // configuring a verified sender; Development may run without one (log-only,
        // loudly), but anywhere else a missing sender is a startup failure rather
        // than silently dropping every notification email.
        if (!string.IsNullOrWhiteSpace(configuration["Ses:FromAddress"]))
        {
            services.AddOptions<SesOptions>()
                .BindConfiguration(SesOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();

            services.AddSingleton<IAmazonSimpleEmailService>(sp =>
            {
                var sesOptions = sp.GetRequiredService<IOptions<SesOptions>>().Value;
                return new AmazonSimpleEmailServiceClient(RegionEndpoint.GetBySystemName(sesOptions.Region));
            });

            services.AddScoped<IEmailSender, SesEmailSender>();
        }
        else if (environment.IsDevelopment())
        {
            services.AddScoped<IEmailSender, LogOnlyEmailSender>();
        }
        else
        {
            throw new InvalidOperationException(
                "Ses:FromAddress must be configured outside Development: notification email is a " +
                "product requirement, and a log-only sender would drop it without a trace.");
        }

        services.AddScoped<INotificationService, SignalRNotificationService>();
        services.AddScoped<IChatNotificationService, SignalRChatNotificationService>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        // ── External sign-in (Google / Facebook) ──────────────────────────────
        // Deliberately NOT ValidateOnStart: an API with no OAuth credentials must
        // still boot and serve password login. A missing provider is a feature that
        // is switched off (its button is hidden), not a misconfigured deployment.
        services.AddOptions<ExternalAuthOptions>()
            .BindConfiguration(ExternalAuthOptions.SectionName);

        // Each provider gets its own named HttpClient so sockets are pooled per host
        // and one provider's slowness cannot starve the other's.
        services.AddHttpClient(nameof(GoogleAuthProvider));
        services.AddHttpClient(nameof(FacebookAuthProvider));

        services.AddMemoryCache();

        // ── WP0 Redis (optional, disabled by default) ─────────────────────────
        // ConnectionStrings:Redis wins; Redis:ConnectionString is the fallback so
        // both `ConnectionStrings__Redis` (compose) and `Redis__ConnectionString`
        // bind. No ValidateOnStart on purpose: Enabled=false with an empty
        // connection string must still boot (memory/DB fallback). Enabled=true
        // with no connection string is a startup failure instead.
        var redis = new RedisOptions();
        configuration.GetSection(RedisOptions.SectionName).Bind(redis);
        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            redis.ConnectionString = redisConnectionString;
        }

        services.AddOptions<RedisOptions>()
            .Configure(o =>
            {
                configuration.GetSection(RedisOptions.SectionName).Bind(o);
                var connectionString = configuration.GetConnectionString("Redis");
                if (!string.IsNullOrWhiteSpace(connectionString))
                {
                    o.ConnectionString = connectionString;
                }
            });

        if (redis.Enabled)
        {
            if (string.IsNullOrWhiteSpace(redis.ConnectionString))
            {
                throw new InvalidOperationException(
                    "Redis:Enabled is true but no Redis connection string is configured. " +
                    "Set ConnectionStrings:Redis (ConnectionStrings__Redis) or Redis:ConnectionString.");
            }

            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redis.ConnectionString;
                options.InstanceName = redis.InstanceName;
            });

            services.AddSingleton<IConnectionMultiplexer>(_ =>
            {
                var multiplexerOptions = ConfigurationOptions.Parse(redis.ConnectionString);
                multiplexerOptions.AbortOnConnectFail = false;
                return ConnectionMultiplexer.Connect(multiplexerOptions);
            });
        }

        services.TryAddSingleton(TimeProvider.System);

        // ── WP5 subject/platform-setting cache: Redis when the Cache flag is ──
        // on, pass-through otherwise (disabled mode behaves byte-identically to
        // uncached code). IDistributedCache only exists when Redis is Enabled,
        // so the real services require both flags.
        if (redis.Enabled && redis.Features.Cache)
        {
            services.AddSingleton<ISubjectCacheService, SubjectCacheService>();
            services.AddSingleton<IPlatformSettingCacheService, PlatformSettingCacheService>();
        }
        else
        {
            services.AddSingleton<ISubjectCacheService>(_ => NoOpSubjectCacheService.Instance);
            services.AddSingleton<IPlatformSettingCacheService>(_ => NoOpPlatformSettingCacheService.Instance);
        }

        services.AddSingleton<IExternalAuthProvider, GoogleAuthProvider>();
        services.AddSingleton<IExternalAuthProvider, FacebookAuthProvider>();

        // ── WP1 OAuth state: Redis when the OAuth flag is on, memory otherwise ──
        // The distributed store needs IConnectionMultiplexer, which only exists
        // when Redis is Enabled — consistent because the OAuth flag implies
        // Enabled. A missing multiplexer fails fast on first resolve (lazy
        // factory), not as a null at runtime.
        if (redis.Enabled && redis.Features.OAuth)
        {
            services.AddSingleton<IRedisStringCommands>(sp =>
            {
                var multiplexer = sp.GetService<IConnectionMultiplexer>()
                    ?? throw new InvalidOperationException(
                        "Redis:Features:OAuth is true but no IConnectionMultiplexer is registered. " +
                        "OAuth state requires Redis:Enabled with a connection string.");
                return new StackExchangeRedisStringCommands(multiplexer.GetDatabase());
            });
            services.AddSingleton<IExternalAuthStateStore, DistributedExternalAuthStateStore>();
        }
        else
        {
            services.AddSingleton<IExternalAuthStateStore, MemoryExternalAuthStateStore>();
        }

        // ── WP4 cron lock: Redis when the CronLock flag is on, no-op otherwise ──
        // The lock seam needs IConnectionMultiplexer, which only exists when
        // Redis is Enabled — consistent because the CronLock flag implies
        // Enabled. Disabled mode runs every tick locally (original behavior).
        if (redis.Enabled && redis.Features.CronLock)
        {
            services.AddSingleton<IRedisLockCommands>(sp =>
            {
                var multiplexer = sp.GetService<IConnectionMultiplexer>()
                    ?? throw new InvalidOperationException(
                        "Redis:Features:CronLock is true but no IConnectionMultiplexer is registered. " +
                        "Cron locks require Redis:Enabled with a connection string.");
                return new StackExchangeRedisLockCommands(multiplexer.GetDatabase());
            });
            services.AddSingleton<IRedisDistributedLock, RedisDistributedLock>();
        }
        else
        {
            services.AddSingleton<IRedisDistributedLock>(_ => NoOpRedisDistributedLock.Instance);
        }

        var signalR = services.AddSignalR();

        // ── WP2 SignalR backplane: Redis when the SignalR flag is on, local otherwise ──
        // The (connectionString, Action<RedisOptions>) overload is deliberate: the
        // backplane owns its connection (opened lazily by the library, never Connect()ed
        // here), so this block creates no ConnectionMultiplexer of its own — the WP0
        // singleton above stays the single shared multiplexer for cache/OAuth. The 8.0.11
        // overloads offer no DI-aware way to hand that multiplexer over (ConnectionFactory
        // is a Func<TextWriter, Task<IConnectionMultiplexer>> with no service provider),
        // and a dedicated backplane connection is the documented Microsoft topology.
        // NOTE: this overload REPLACES the library default Configuration (which already
        // has AbortOnConnectFail=false) with ConfigurationOptions.Parse output (default
        // true), so re-assert AbortOnConnectFail=false here: Redis down must never block
        // boot, and the lifetime manager then connects in the background. Hub group names
        // are unchanged. Group sends already degrade (try/catch + warn in the
        // SignalR*NotificationService senders); hub group joins degrade the same way.
        if (redis.Enabled && redis.Features.SignalR)
        {
            signalR.AddStackExchangeRedis(redis.ConnectionString, o =>
            {
                // RedisChannel.Literal: the implicit string conversion is obsolete;
                // the prefix is a fixed namespace, never a pattern.
                o.Configuration.ChannelPrefix = RedisChannel.Literal("TutorHub");
                o.Configuration.AbortOnConnectFail = false;
            });
        }

        // Background Workers
        services.AddHostedService<BookingTimeoutBackgroundService>();
        services.AddHostedService<OutboxDispatcherJob>();
        services.AddHostedService<EmailDeliveryJob>();
        services.AddHostedService<SessionReminderJob>();
        services.AddHostedService<GracePeriodReminderJob>();
        services.AddHostedService<AutoPayoutJob>();

        return services;
    }
}
