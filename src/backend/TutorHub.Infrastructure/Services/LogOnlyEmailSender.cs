using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services;

/// <summary>
/// F-25: development stub — logs instead of sending. The name states this
/// explicitly so nobody mistakes it for a real provider. Replace with an
/// SMTP/API implementation (owner decision) before production email.
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
