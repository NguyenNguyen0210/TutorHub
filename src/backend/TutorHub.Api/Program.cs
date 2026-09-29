using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using System.Net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using TutorHub.Api.Configuration;
using TutorHub.Api.Exceptions;
using TutorHub.Api.HealthChecks;
using TutorHub.Api.Middlewares;
using TutorHub.Api.RateLimiting;
using TutorHub.Application;
using TutorHub.Infrastructure;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.HealthChecks;
using TutorHub.Infrastructure.Hubs;
using TutorHub.Infrastructure.Redis;

var builder = WebApplication.CreateBuilder(args);

// F-25: .env loader is Development-only and never overrides real environment
// variables (container/CI secrets always win).
if (builder.Environment.IsDevelopment())
{
    var searchDir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (searchDir != null)
    {
        var dotenv = Path.Combine(searchDir.FullName, ".env");
        if (File.Exists(dotenv))
        {
            foreach (var line in File.ReadAllLines(dotenv))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#')) continue;
                var parts = trimmed.Split('=', 2);
                if (parts.Length == 2)
                {
                    var key = parts[0].Trim();
                    if (Environment.GetEnvironmentVariable(key) == null)
                    {
                        var val = parts[1].Trim().Trim('"', '\'');
                        Environment.SetEnvironmentVariable(key, val);
                    }
                }
            }
            break;
        }
        searchDir = searchDir.Parent;
    }
}

builder.Configuration.AddEnvironmentVariables();

// F-25 hardening: refuse to start while a secret still holds a template value.
StartupSecretGuard.ValidateNoPlaceholderSecrets(builder.Configuration);

// Add Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddHttpContextAccessor();

// Exception Handling & Problem Details
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Controllers with Global String Enum Converter
builder.Services.AddControllers()
    // P0 dev-tooling: swap in a discovery provider that drops IDevelopmentOnlyEndpoint
    // controllers outside Development. The default provider has to be removed as well,
    // otherwise it would still discover them.
    .ConfigureApplicationPartManager(manager =>
    {
        var defaultProviders = manager.FeatureProviders
            .OfType<ControllerFeatureProvider>()
            .ToList();

        foreach (var provider in defaultProviders)
        {
            manager.FeatureProviders.Remove(provider);
        }

        manager.FeatureProviders.Add(new DevelopmentOnlyControllerFeatureProvider(builder.Environment));
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// JWT Authentication Configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;
        // F-25: HTTPS metadata only skippable in Development (local HTTP).
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero // Immediate expiration check
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Swagger with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TutorHub API",
        Version = "v1",
        Description = "Backend REST API for TutorHub Tutor Matching Platform"
    });

    // Prevent duplicate schema ID conflicts across vertical slice DTOs
    c.CustomSchemaIds(type => type.ToString().Replace("+", "."));

    // Resolve conflicting actions with identical path/method (e.g. multipart vs json endpoints)
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    // Configure HTTP Bearer JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT Access Token của bạn vào đây (Swagger sẽ tự động đính kèm 'Bearer ' phía trước)."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments documentation
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// P0-E3: readiness = the instance can actually serve traffic (database reachable and
// the platform fee setting every payment activation snapshots is configured), while
// liveness only asks whether the process answers.
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<PlatformFeeSettingHealthCheck>("platform-fee-setting")
    .AddCheck<RedisHealthCheck>("redis");

// P0-E2: the frontend is served from its own origin, so preflight must succeed.
// Credentials flow with the request, hence explicit origins instead of a wildcard.
var allowedOrigins = CorsOrigins.Resolve(builder.Configuration, builder.Environment);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithExposedHeaders("X-Correlation-ID"));
});

// P0-D2: per-IP throttling for credential and payment endpoints.
builder.Services.AddTutorHubRateLimiting();

// WP3: distributed fixed-window limiter over Redis when the RateLimit flag is
// on; the in-memory limiter above stays registered as the fallback. The
// IConnectionMultiplexer this seam needs only exists when Redis is Enabled —
// consistent because the RateLimit flag implies Enabled. A missing
// multiplexer fails fast on first resolve (lazy factory), not as a null at
// runtime. RedisOptions binding mirrors the Infrastructure registration
// (ConnectionStrings:Redis wins over Redis:ConnectionString).
var redisRateLimit = new RedisOptions();
builder.Configuration.GetSection(RedisOptions.SectionName).Bind(redisRateLimit);
var redisRateLimitConnectionString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisRateLimitConnectionString))
{
    redisRateLimit.ConnectionString = redisRateLimitConnectionString;
}

if (redisRateLimit.Enabled && redisRateLimit.Features.RateLimit)
{
    builder.Services.AddSingleton<IRedisRateLimitCommands>(sp =>
    {
        var multiplexer = sp.GetService<IConnectionMultiplexer>()
            ?? throw new InvalidOperationException(
                "Redis:Features:RateLimit is true but no IConnectionMultiplexer is registered. " +
                "Distributed rate limiting requires Redis:Enabled with a connection string.");
        return new StackExchangeRedisRateLimitCommands(multiplexer.GetDatabase());
    });
    builder.Services.AddSingleton<RedisRateLimitService>();
}

// WP6: per-user token-version reader for the revocation middleware. Always
// registered (the database always exists); the middleware itself only runs
// when Redis is enabled with the RevokeCheck flag.
builder.Services.AddScoped<ITokenVersionReader, EfTokenVersionReader>();

// P0-D2: honour X-Forwarded-* ONLY when explicitly deployed behind a proxy. Enabling
// this unconditionally lets any client spoof its address and evade the per-IP limiter.
if (builder.Configuration.GetValue<bool>("ReverseProxy:Enabled"))
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

        var knownProxies = builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>();
        if (knownProxies is { Length: > 0 })
        {
            options.KnownProxies.Clear();
            foreach (var proxy in knownProxies)
            {
                if (IPAddress.TryParse(proxy, out var parsedProxy))
                {
                    options.KnownProxies.Add(parsedProxy);
                }
            }
        }
    });
}

var app = builder.Build();

// Optional schema bootstrap for containerised runs. Nothing else applies migrations
// (the documented local path is scripts/dev-bootstrap.ps1), so a fresh pgdata volume
// left the API answering 503 from the readiness probe. Off by default — production and
// `dotnet run` are unaffected — and only docker-compose turns it on for the api service.
if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    using var migrationScope = app.Services.CreateScope();
    var migrationDb = migrationScope.ServiceProvider
        .GetRequiredService<TutorHub.Infrastructure.Persistence.AppDbContext>();
    await migrationDb.Database.MigrateAsync();
}

// P0-D2: must run before anything that reads Connection.RemoteIpAddress.
if (app.Configuration.GetValue<bool>("ReverseProxy:Enabled"))
{
    app.UseForwardedHeaders();
}

// F-25 / P0-E3: readiness, kept on the path docker-compose already probes. A failing
// dependency answers 503, which `curl -f` reports as unhealthy.
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = HealthCheckResponseWriter.WriteAsync
});

// P0-E3: liveness runs no dependency checks on purpose — a database outage must not
// make an orchestrator restart a process that is otherwise fine.
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = HealthCheckResponseWriter.WriteAsync
});

app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseMiddleware<TutorHub.Api.Middlewares.CorrelationIdMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TutorHub API v1"));
}

app.UseHttpsRedirection();

app.UseRouting();

// P0-E2: before the rate limiter, so a browser preflight (which carries no
// credentials) never consumes the caller's credential budget.
app.UseCors();

// P0-D2: throttle before authentication so credential stuffing is limited even for
// requests that never present a valid token. WP3: Redis-backed fixed window when
// the RateLimit flag is on (every node shares one budget), otherwise the
// in-memory limiter above.
if (redisRateLimit.Enabled && redisRateLimit.Features.RateLimit)
{
    app.UseMiddleware<RedisRateLimitMiddleware>();
}
else
{
    app.UseRateLimiter();
}

app.UseAuthentication();
app.UseAuthorization();

// WP6: instant JWT revocation via per-user TokenVersion (PO 2026-09-29
// overrides F-08). Only when Redis is enabled with the RevokeCheck flag;
// otherwise authenticated requests flow exactly as before (the middleware
// additionally no-ops on flag-off for defense in depth).
if (redisRateLimit.Enabled && redisRateLimit.Features.RevokeCheck)
{
    app.UseMiddleware<TokenRevocationMiddleware>();
}

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

// Required for Integration Testing WebApplicationFactory
public partial class Program { }
