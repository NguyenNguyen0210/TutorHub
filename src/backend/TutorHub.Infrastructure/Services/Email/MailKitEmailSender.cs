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
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        var fromName = string.IsNullOrWhiteSpace(_options.FromDisplayName) ? "TutorHub" : _options.FromDisplayName;
        message.From.Add(new MailboxAddress(fromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

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
            : (_options.Port == 587
                ? SecureSocketOptions.StartTls
                : (_options.Port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto));

        await client.ConnectAsync(_options.Host, _options.Port, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_options.UserName) && !string.IsNullOrWhiteSpace(_options.Password))
        {
            // Remove XOAUTH2 so MailKit falls back to standard PLAIN/LOGIN password auth.
            // When connecting to smtp.gmail.com with App Passwords, MailKit otherwise negotiates
            // XOAUTH2 which Google rejects with 535: 5.7.8 BadCredentials.
            client.AuthenticationMechanisms?.Remove("XOAUTH2");

            var password = _options.Password;
            if (_options.Host.Contains("gmail.com", StringComparison.OrdinalIgnoreCase))
            {
                // Google App Passwords are 16 letters, frequently copied with spaces or underscores.
                password = password.Replace(" ", "").Replace("_", "");
            }

            await client.AuthenticateAsync(_options.UserName, password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        _logger.LogInformation(
            "Sent email through MailKit SMTP: To={ToEmail}, Subject=\"{Subject}\", IdempotencyKey={IdempotencyKey}",
            toEmail,
            subject,
            idempotencyKey);
    }
}
