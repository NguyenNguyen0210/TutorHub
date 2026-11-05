using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services.Email;

public class MailKitEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<MailKitEmailSender> _logger;
    private readonly Func<ISmtpClient> _clientFactory;

    public MailKitEmailSender(
        IOptions<SmtpOptions> options,
        ILogger<MailKitEmailSender> logger,
        Func<ISmtpClient>? clientFactory = null)
    {
        _options = options.Value;
        _logger = logger;
        _clientFactory = clientFactory ?? (() => new SmtpClient());
    }

    public async Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        string? correlationId = null,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        var fromName = string.IsNullOrWhiteSpace(_options.FromDisplayName) ? "TutorHub" : _options.FromDisplayName;
        message.From.Add(new MailboxAddress(fromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        if (!string.IsNullOrWhiteSpace(correlationId))
        {
            message.Headers.Add("X-Correlation-ID", correlationId);
            var cleanId = correlationId.Replace("email:", "").Trim();
            if (!string.IsNullOrWhiteSpace(cleanId))
            {
                var senderDomain = message.From.Mailboxes.First().Address.Split('@')[^1];
                message.MessageId = $"<{cleanId}@{senderDomain}>";
            }
        }

        var bodyBuilder = new BodyBuilder();
        if (body.TrimStart().StartsWith("<") && (body.Contains("</html>") || body.Contains("</div>") || body.Contains("</p>")))
        {
            bodyBuilder.HtmlBody = body;
        }
        else
        {
            bodyBuilder.TextBody = body;
        }
        message.Body = bodyBuilder.ToMessageBody();

        using var client = _clientFactory();

        var socketOptions = _options.UseSsl
            ? SecureSocketOptions.SslOnConnect
            : (_options.Port is 25 or 587 or 2587
                ? SecureSocketOptions.StartTls
                : (_options.Port is 465 or 2465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto));

        await client.ConnectAsync(_options.Host, _options.Port, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_options.UserName) && !string.IsNullOrWhiteSpace(_options.Password))
        {
            // Resend authenticates with the fixed username and an API key as the
            // SMTP password. Keep credentials intact, including underscores.
            client.AuthenticationMechanisms?.Remove("XOAUTH2");
            await client.AuthenticateAsync(_options.UserName, _options.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        _logger.LogInformation(
            "Sent email through MailKit SMTP: To={ToEmail}, Subject=\"{Subject}\", CorrelationId={CorrelationId}",
            toEmail,
            subject,
            correlationId);
    }
}
