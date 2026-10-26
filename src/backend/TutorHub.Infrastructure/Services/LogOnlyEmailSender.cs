using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services;

/// <summary>
/// Development fallback — logs instead of sending, used only when
/// SMTP is not configured. Any other environment refuses to start without a real
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
        string? correlationId = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[DEV EMAIL DISPATCHED] To={ToEmail} | Subject=\"{Subject}\" | CorrelationId={CorrelationId}\n----- Email Content -----\n{Body}\n---------------------------",
            toEmail,
            subject,
            correlationId,
            body);

        return Task.CompletedTask;
    }
}
