using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Core;
using Serilog.Events;
using TutorHub.Api.Middlewares;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// WP7: Serilog boot + correlation enrichment. The middleware log-context
/// assertions run on <see cref="DefaultHttpContext"/> with a local in-memory
/// Serilog sink (no static logger, no Docker); the boot cases prove the API
/// serves traffic with Seq disabled and with Seq unreachable (the Seq sink
/// batches in the background and must never block startup).
/// </summary>
public class SerilogCorrelationTests : IDisposable
{
    [Fact]
    public async Task InvokeAsync_PushesIncomingCorrelationId_IntoLogContext()
    {
        using var captured = new CapturingLogger();
        var middleware = new CorrelationIdMiddleware(_ =>
        {
            captured.Logger.Information("ping");
            return Task.CompletedTask;
        });
        var context = new DefaultHttpContext();
        context.Request.Headers[CorrelationIdMiddleware.CorrelationIdHeader] = "test-correlation-123";

        await middleware.InvokeAsync(context);

        captured.Events.Should().ContainSingle()
            .Which.Properties.Should().ContainKey("CorrelationId")
            .WhoseValue.Should().BeEquivalentTo(new ScalarValue("test-correlation-123"));
    }

    [Fact]
    public async Task InvokeAsync_GeneratesCorrelationId_WhenHeaderMissing()
    {
        using var captured = new CapturingLogger();
        var middleware = new CorrelationIdMiddleware(_ =>
        {
            captured.Logger.Information("ping");
            return Task.CompletedTask;
        });
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        var responseId = context.Response.Headers[CorrelationIdMiddleware.CorrelationIdHeader].ToString();
        responseId.Should().NotBeNullOrEmpty();
        captured.Events.Should().ContainSingle()
            .Which.Properties.Should().ContainKey("CorrelationId")
            .WhoseValue.Should().BeEquivalentTo(new ScalarValue(responseId));
    }

    [Theory]
    [InlineData("")] // Seq disabled: console-only logging.
    [InlineData("http://127.0.0.1:59999")] // Seq down: batching sink must not block boot.
    public async Task Boot_WithSeqDisabledOrDown_ServesTraffic(string seqUrl)
    {
        using var factory = new SerilogBootFactory(seqUrl);
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/health/live");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    public void Dispose()
    {
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Local Serilog logger (never touches the static <c>Log</c> class, so it
    /// cannot race factory boots that reconfigure it) piping to an in-memory
    /// sink. <c>FromLogContext</c> is what surfaces the middleware's
    /// <c>PushProperty</c>, exactly like the API's own configuration.
    /// </summary>
    private sealed class CapturingLogger : IDisposable
    {
        private readonly Logger _logger;
        private readonly CapturingSink _sink = new();

        public CapturingLogger()
        {
            _logger = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .WriteTo.Sink(_sink)
                .CreateLogger();
        }

        public ILogger Logger => _logger;

        public IReadOnlyList<LogEvent> Events => _sink.Events;

        public void Dispose() => _logger.Dispose();
    }

    private sealed class CapturingSink : ILogEventSink
    {
        private readonly List<LogEvent> _events = new();

        public IReadOnlyList<LogEvent> Events
        {
            get
            {
                lock (_events)
                {
                    return _events.ToList();
                }
            }
        }

        public void Emit(LogEvent logEvent)
        {
            lock (_events)
            {
                _events.Add(logEvent);
            }
        }
    }

    /// <summary>
    /// Full app with only the Seq URL varied. Redis stays disabled (default),
    /// <c>/health/live</c> runs zero health checks, so no Postgres, Redis, or
    /// Docker is needed. Background jobs are removed for determinism, like the
    /// shared integration factory.
    /// </summary>
    private sealed class SerilogBootFactory : WebApplicationFactory<Program>
    {
        private readonly string _seqUrl;

        public SerilogBootFactory(string seqUrl)
        {
            _seqUrl = seqUrl;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Seq:ServerUrl"] = _seqUrl,

                    // Test-only dummy secrets: this sandbox sets no real secret
                    // env vars (CI/dev machines do), and the app refuses to boot
                    // without them (ValidateOnStart). Values are random-looking
                    // and contain no StartupSecretGuard placeholder fragment;
                    // they never leave the test process.
                    ["Jwt:Secret"] = "9f2c4a6e8b1d3f5a7c9e2b4d6f8a1c3e5d7f9a1b3d5f7a9c2e4b6d8f0a2c4e6",
                    ["RefreshToken:Pepper"] = "1a3c5e7b9d2f4a6c8e0b3d5f7a9c1e3b5d7f9a2c4e6b8d0f2a4c6e8b0d2f4a6c8",
                    ["VnPay:TmnCode"] = "TESTTMN1",
                    ["VnPay:HashSecret"] = "2b4d6f8a1c3e5d7f9a1b3d5f7a9c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6",
                    ["CloudflareR2:AccountId"] = "test-account-id",
                    ["CloudflareR2:AccessKeyId"] = "test-access-key-id",
                    ["CloudflareR2:SecretAccessKey"] = "3d5f7a9c1e3b5d7f9a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b3d5f7a9c1e3b5d"
                });
            });

            builder.ConfigureServices(services =>
            {
                var hosted = services
                    .Where(d => d.ServiceType == typeof(IHostedService))
                    .ToList();
                foreach (var descriptor in hosted)
                {
                    services.Remove(descriptor);
                }
            });
        }
    }
}
