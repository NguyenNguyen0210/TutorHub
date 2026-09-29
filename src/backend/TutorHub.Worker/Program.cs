using Microsoft.EntityFrameworkCore;
using Serilog;
using TutorHub.Application;
using TutorHub.Infrastructure;
using TutorHub.Infrastructure.Persistence;

var builder = Host.CreateApplicationBuilder(args);

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
        .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
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

// CurrentUserService (registered inside AddInfrastructure) needs the accessor;
// the generic host has no HTTP context, so it simply resolves to null here.
builder.Services.AddHttpContextAccessor();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

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
