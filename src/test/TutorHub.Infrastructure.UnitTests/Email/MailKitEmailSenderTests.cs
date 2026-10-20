using FluentAssertions;
using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MimeKit;
using Moq;
using TutorHub.Infrastructure.Services.Email;
using Xunit;

namespace TutorHub.Infrastructure.UnitTests.Email;

public class MailKitEmailSenderTests
{
    private readonly Mock<ISmtpClient> _smtpClientMock = new();
    private readonly SmtpOptions _options = new()
    {
        Host = "smtp.test.com",
        Port = 587,
        UseSsl = false,
        FromAddress = "noreply@tutorhub.vn",
        FromDisplayName = "TutorHub Test",
        UserName = "user@test.com",
        Password = "secretpassword"
    };

    [Fact]
    public async Task SendEmailAsync_ConnectsAuthenticatesAndSendsMessage()
    {
        // Arrange
        MimeMessage? capturedMessage = null;
        _smtpClientMock
            .Setup(c => c.SendAsync(It.IsAny<MimeMessage>(), It.IsAny<CancellationToken>(), It.IsAny<ITransferProgress>()))
            .Callback<MimeMessage, CancellationToken, ITransferProgress>((m, _, _) => capturedMessage = m)
            .ReturnsAsync("250 OK");

        var sender = new MailKitEmailSender(
            Options.Create(_options),
            NullLogger<MailKitEmailSender>.Instance,
            () => _smtpClientMock.Object);

        // Act
        await sender.SendEmailAsync("student@test.com", "Test Subject", "Hello World!", "idemp-1");

        // Assert
        _smtpClientMock.Verify(c => c.ConnectAsync("smtp.test.com", 587, SecureSocketOptions.StartTls, It.IsAny<CancellationToken>()), Times.Once);
        _smtpClientMock.Verify(c => c.AuthenticateAsync("user@test.com", "secretpassword", It.IsAny<CancellationToken>()), Times.Once);
        _smtpClientMock.Verify(c => c.SendAsync(It.IsAny<MimeMessage>(), It.IsAny<CancellationToken>(), It.IsAny<ITransferProgress>()), Times.Once);
        _smtpClientMock.Verify(c => c.DisconnectAsync(true, It.IsAny<CancellationToken>()), Times.Once);

        capturedMessage.Should().NotBeNull();
        capturedMessage!.To.Mailboxes.Single().Address.Should().Be("student@test.com");
        capturedMessage.From.Mailboxes.Single().Address.Should().Be("noreply@tutorhub.vn");
        capturedMessage.Subject.Should().Be("Test Subject");
        capturedMessage.TextBody.Should().Be("Hello World!");
    }

    [Fact]
    public async Task SendEmailAsync_WithoutCredentials_DoesNotAuthenticate()
    {
        // Arrange
        _options.UserName = null;
        _options.Password = null;

        var sender = new MailKitEmailSender(
            Options.Create(_options),
            NullLogger<MailKitEmailSender>.Instance,
            () => _smtpClientMock.Object);

        // Act
        await sender.SendEmailAsync("student@test.com", "Test Subject", "Plain text message");

        // Assert
        _smtpClientMock.Verify(c => c.ConnectAsync("smtp.test.com", 587, SecureSocketOptions.StartTls, It.IsAny<CancellationToken>()), Times.Once);
        _smtpClientMock.Verify(c => c.AuthenticateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _smtpClientMock.Verify(c => c.SendAsync(It.IsAny<MimeMessage>(), It.IsAny<CancellationToken>(), It.IsAny<ITransferProgress>()), Times.Once);
        _smtpClientMock.Verify(c => c.DisconnectAsync(true, It.IsAny<CancellationToken>()), Times.Once);
    }
}
