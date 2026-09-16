using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services;

/// <summary>
/// F-25 / P0-E1: Development fallback — logs instead of sending, used only when
/// SES is not configured. Any other environment refuses to start without a real
/// sender (see InfrastructureServiceCollectionExtensions), so this type can never
/// be the production transport by accident.
/// </summary>
public class LogOnlyEmailSender : IEmailSender
{
    private readonly ILogger<LogOnlyEmailSender> _logger;

    public LogOnlyEmailSender(ILogger<LogOnlyEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Dispatched Email: To={ToEmail}, Subject={Subject}, IdempotencyKey={IdempotencyKey}",
            toEmail,
            subject,
            idempotencyKey);

        return Task.CompletedTask;
    }
}
