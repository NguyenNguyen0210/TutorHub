using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services;

public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
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
