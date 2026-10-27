namespace TutorHub.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        string? correlationId = null,
        CancellationToken cancellationToken = default);
}
