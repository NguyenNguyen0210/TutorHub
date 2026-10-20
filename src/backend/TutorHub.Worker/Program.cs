using Microsoft.EntityFrameworkCore;
using Serilog;
using TutorHub.Infrastructure.Configuration;
using TutorHub.Infrastructure.Persistence;

var builder = Host.CreateApplicationBuilder(args);

// F-25: .env loader is Development-only and never overrides real environment
// variables (container/CI secrets always win). Mirrors TutorHub.Api/Program.cs.
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

// Structured logging, mirroring the Api: console compact-JSON always, Seq sink
// only when Seq:ServerUrl is set (empty = console-only, Seq down never blocks).
builder.Services.AddSerilog((services, loggerConfig) =>
{
    loggerConfig
        .ReadFrom.Configuration(builder.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
        .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning);

    var seqUrl = builder.Configuration["Seq:ServerUrl"];
    if (!string.IsNullOrWhiteSpace(seqUrl))
    {
        var seqApiKey = builder.Configuration["Seq:ApiKey"];
        if (string.IsNullOrWhiteSpace(seqApiKey))
        {
            loggerConfig.WriteTo.Seq(seqUrl);
        }
        else
        {
            loggerConfig.WriteTo.Seq(seqUrl, apiKey: seqApiKey);
        }
    }
});

// F-25 hardening: refuse to start while a secret still holds a template value.
StartupSecretGuard.ValidateNoPlaceholderSecrets(builder.Configuration);

// Shared job-host composition (same method WorkerBootTests exercises).
builder.Services.AddWorkerComposition(builder.Configuration, builder.Environment);

var host = builder.Build();

// Same opt-in schema bootstrap as the Api; compose leaves it off for the worker
// (the api service migrates) and it stays off for local `dotnet run`.
if (host.Services.GetRequiredService<IConfiguration>().GetValue<bool>("Database:MigrateOnStartup"))
{
    using var migrationScope = host.Services.CreateScope();
    var migrationDb = migrationScope.ServiceProvider.GetRequiredService<AppDbContext>();
    await migrationDb.Database.MigrateAsync();
}

host.Run();
