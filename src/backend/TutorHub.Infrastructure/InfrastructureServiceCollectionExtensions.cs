using TutorHub.Application.Common.Settings;
using Amazon;
using Amazon.Runtime;
using Amazon.S3;
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
using TutorHub.Infrastructure.Services.Idempotency;
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

        // Auth token lifetimes: same "Jwt" section, consumed by
        // Login/RefreshToken handlers so persisted expiries match signing.
        services.AddOptions<AuthTokenLifetimeOptions>()
            .BindConfiguration(AuthTokenLifetimeOptions.SectionName)
            .ValidateOnStart();

        // Refresh token hashing pepper. Required: tokens are stored hashed,
        // and the pepper must never live in the database alongside them.
        services.AddOptions<RefreshTokenOptions>()
            .BindConfiguration(RefreshTokenOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Account lockout thresholds.
        services.AddOptions<AuthLockoutOptions>()
            .BindConfiguration(AuthLockoutOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Platform Fee Options Pattern Configuration
        services.AddOptions<PlatformFeeOptions>()
            .BindConfiguration(PlatformFeeOptions.SectionName)
            .Configure<IConfiguration>((options, config) =>
            {
                var raw = config["PlatformFee:Rate"] ?? config["PlatformFeeRate"];
                if (raw != null)
                {
                    if (string.IsNullOrWhiteSpace(raw))
                    {
                        options.Rate = null;
                    }
                    else if (decimal.TryParse(raw, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
                    {
                        options.Rate = parsed;
                    }
                    else
                    {
                        options.Rate = -1m;
                    }
                }
            })
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Scheduling Options Pattern Configuration
        services.AddOptions<SchedulingOptions>()
            .BindConfiguration(SchedulingOptions.SectionName)
            .Configure<IConfiguration>((options, config) =>
            {
                var raw = config["Scheduling:MinimumNoticeHours"] ?? config["MinimumNoticeHours"];
                if (int.TryParse(raw, out var parsed) && parsed >= 0)
                {
                    options.MinimumNoticeHours = parsed;
                }
            })
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Review Options Pattern Configuration
        services.AddOptions<ReviewOptions>()
            .BindConfiguration(ReviewOptions.SectionName)
            .Configure<IConfiguration>((options, config) =>
            {
                var raw = config["Review:WindowDays"] ?? config["ReviewWindowDays"];
                if (int.TryParse(raw, out var parsed) && parsed > 0)
                {
                    options.WindowDays = parsed;
                }
            })
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Withdrawal Options Pattern Configuration
        services.AddOptions<WithdrawalOptions>()
            .BindConfiguration(WithdrawalOptions.SectionName)
            .Configure<IConfiguration>((options, config) =>
            {
                var raw = config["Withdrawal:MinAmount"] ?? config["MinWithdrawalAmount"];
                if (decimal.TryParse(raw, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsed) && parsed > 0)
                {
                    options.MinAmount = parsed;
                }
            })
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Bank Transfer Options Pattern Configuration
        services.AddOptions<BankTransferOptions>()
            .BindConfiguration(BankTransferOptions.SectionName)
            .Configure<IConfiguration>((options, config) =>
            {
                var name = config["BankTransfer:BankName"] ?? config["PlatformBankName"];
                if (!string.IsNullOrWhiteSpace(name)) options.BankName = name;

                var accNo = config["BankTransfer:AccountNumber"] ?? config["PlatformBankAccountNo"];
                if (!string.IsNullOrWhiteSpace(accNo)) options.AccountNumber = accNo;

                var accName = config["BankTransfer:AccountName"] ?? config["PlatformBankAccountName"];
                if (!string.IsNullOrWhiteSpace(accName)) options.AccountName = accName;
            })
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

        // Email delivery via MailKit (SMTP). A deployment opts in by configuring
        // Smtp:Host and Smtp:FromAddress; Development may run without one (log-only fallback),
        // but anywhere else a missing SMTP configuration is a startup failure rather than
        // silently dropping notification emails.
        if (!string.IsNullOrWhiteSpace(configuration["Smtp:Host"]) &&
            !string.IsNullOrWhiteSpace(configuration["Smtp:FromAddress"]))
        {
            services.AddOptions<SmtpOptions>()
                .BindConfiguration(SmtpOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();

            services.AddScoped<IEmailSender, MailKitEmailSender>();
        }
        else if (environment.IsDevelopment())
        {
            services.AddScoped<IEmailSender, LogOnlyEmailSender>();
        }
        else
        {
            throw new InvalidOperationException(
                "Smtp:Host and Smtp:FromAddress must be configured outside Development: notification email is a " +
                "product requirement, and a log-only sender would drop it without a trace.");
        }

        services.AddScoped<INotificationService, SignalRNotificationService>();
        services.AddScoped<IChatNotificationService, SignalRChatNotificationService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IIdempotencyStore, DbIdempotencyStore>();

        // ── External sign-in (Google) ──────────────────────────────────────────
        // Deliberately NOT ValidateOnStart: an API with no OAuth credentials must
        // still boot and serve password login. A missing provider is a feature that
        // is switched off (its button is hidden), not a misconfigured deployment.
        services.AddOptions<ExternalAuthOptions>()
            .BindConfiguration(ExternalAuthOptions.SectionName);

        // Each provider gets its own named HttpClient so sockets are pooled per host
        // and one provider's slowness cannot starve the other's.
        services.AddHttpClient(nameof(GoogleAuthProvider));

        services.AddMemoryCache();

        // ── Redis (optional, disabled by default) ─────────────────────────
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

        var redisConnStr = !string.IsNullOrWhiteSpace(redis.ConnectionString)
            ? redis.ConnectionString
            : "localhost:6379";

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnStr;
            options.InstanceName = redis.InstanceName;
        });

        services.AddSingleton<IConnectionMultiplexer>(_ =>
        {
            var multiplexerOptions = ConfigurationOptions.Parse(redisConnStr);
            multiplexerOptions.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(multiplexerOptions);
        });

        services.TryAddSingleton(TimeProvider.System);

        // Core Redis-backed Cache Services
        services.AddSingleton<IServiceDetailCacheService, ServiceDetailCacheService>();
        services.AddSingleton<ITutorProfileCacheService, TutorProfileCacheService>();

        services.AddSingleton<IExternalAuthProvider, GoogleAuthProvider>();

        // Redis-backed OAuth state
        services.AddSingleton<IRedisStringCommands>(sp =>
        {
            var multiplexer = sp.GetService<IConnectionMultiplexer>()
                ?? throw new InvalidOperationException("No IConnectionMultiplexer is registered.");
            return new StackExchangeRedisStringCommands(multiplexer.GetDatabase());
        });
        services.AddSingleton<IExternalAuthStateStore, DistributedExternalAuthStateStore>();

        // Redis Distributed Cron Lock
        services.AddSingleton<IRedisLockCommands>(sp =>
        {
            var multiplexer = sp.GetService<IConnectionMultiplexer>()
                ?? throw new InvalidOperationException("No IConnectionMultiplexer is registered.");
            return new StackExchangeRedisLockCommands(multiplexer.GetDatabase());
        });
        services.AddSingleton<IRedisDistributedLock, RedisDistributedLock>();

        // Redis SignalR Backplane
        var signalR = services.AddSignalR();
        signalR.AddStackExchangeRedis(redisConnStr, o =>
        {
            o.Configuration.ChannelPrefix = RedisChannel.Literal("TutorHub");
            o.Configuration.AbortOnConnectFail = false;
        });

        // Background jobs: default true runs hosted services directly in the API host.
        if (configuration.GetValue("BackgroundJobs:Enabled", true))
        {
            // Background Workers
            services.AddHostedService<BookingTimeoutBackgroundService>();
            services.AddHostedService<OutboxDispatcherJob>();
            services.AddHostedService<EmailDeliveryJob>();


            services.AddHostedService<AutoPayoutJob>();
            services.AddHostedService<IdempotencyCleanupJob>();
        }

        return services;
    }
}
