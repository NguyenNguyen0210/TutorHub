using Amazon.SimpleEmail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using SesModel = Amazon.SimpleEmail.Model;

namespace TutorHub.Infrastructure.Services.Email;

/// <summary>
/// P0-E1: real email delivery through Amazon SES. Replaces the Development-only
/// <c>LogOnlyEmailSender</c> in every environment that configures
/// <c>Ses:FromAddress</c>.
///
/// The stored notification body is plain text (see BusinessEventNotificationHandler
/// and the reminder jobs), so it is sent as the text part only; wrapping it in HTML
/// would collapse its line breaks.
/// </summary>
public class SesEmailSender : IEmailSender
{
    private readonly IAmazonSimpleEmailService _ses;
    private readonly SesOptions _options;
    private readonly ILogger<SesEmailSender> _logger;

    public SesEmailSender(
        IAmazonSimpleEmailService ses,
        IOptions<SesOptions> options,
        ILogger<SesEmailSender> logger)
    {
        _ses = ses;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        var request = new SesModel.SendEmailRequest
        {
            Source = BuildSource(),
            Destination = new SesModel.Destination
            {
                ToAddresses = new List<string> { toEmail }
            },
            Message = new SesModel.Message
            {
                Subject = new SesModel.Content { Data = subject, Charset = "UTF-8" },
                Body = new SesModel.Body
                {
                    Text = new SesModel.Content { Data = body, Charset = "UTF-8" }
                }
            }
        };

        if (!string.IsNullOrWhiteSpace(_options.ConfigurationSetName))
        {
            request.ConfigurationSetName = _options.ConfigurationSetName;
        }

        var response = await _ses.SendEmailAsync(request, cancellationToken);

        // The idempotency key is not a SES concept; it is logged so a delivery can be
        // traced from the EmailDeliveries row to the SES MessageId.
        _logger.LogInformation(
            "Sent email through SES: To={ToEmail}, MessageId={MessageId}, IdempotencyKey={IdempotencyKey}",
            toEmail,
            response.MessageId,
            idempotencyKey);
    }

    private string BuildSource() =>
        string.IsNullOrWhiteSpace(_options.FromDisplayName)
            ? _options.FromAddress
            : $"{_options.FromDisplayName} <{_options.FromAddress}>";
}
