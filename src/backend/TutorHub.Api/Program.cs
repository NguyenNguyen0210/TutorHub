using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using System.Net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TutorHub.Api.Configuration;
using TutorHub.Api.Exceptions;
using TutorHub.Api.HealthChecks;
using TutorHub.Application;
using TutorHub.Infrastructure;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.Hubs;

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
    .AddCheck<PlatformFeeSettingHealthCheck>("platform-fee-setting");

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

app.UseExceptionHandler(_ => { });

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
// requests that never present a valid token.
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

// Required for Integration Testing WebApplicationFactory
public partial class Program { }
