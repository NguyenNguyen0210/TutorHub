namespace TutorHub.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default);
}
