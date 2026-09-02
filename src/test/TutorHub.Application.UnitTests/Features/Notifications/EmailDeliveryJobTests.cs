using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.BackgroundServices;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Notifications;

public class EmailDeliveryJobTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<IEmailSender> _emailSenderMock = new();
    private readonly Mock<ILogger<EmailDeliveryJob>> _loggerMock = new();
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock = new();
    private readonly Mock<IServiceScope> _scopeMock = new();
    private readonly Mock<IServiceProvider> _serviceProviderMock = new();

    public EmailDeliveryJobTests()
    {
        _scopeFactoryMock.Setup(s => s.CreateScope()).Returns(_scopeMock.Object);
        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IAppDbContext))).Returns(_dbContextMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IEmailSender))).Returns(_emailSenderMock.Object);
    }

    [Fact]
    public async Task ProcessPendingEmailsBatchAsync_WhenPendingEmailExists_SendsEmailAndMarksSent()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        var email = new EmailDelivery
        {
            Id = deliveryId,
            NotificationId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ToEmail = "user@test.com",
            Subject = "Test Subject",
            Body = "Test Body",
            Status = EmailDeliveryStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var emailList = new List<EmailDelivery> { email };
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailList).Object);

        var job = new EmailDeliveryJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingEmailsBatchAsync(CancellationToken.None);

        // Assert (DEC-S7-010, INV-EVENT-017)
        processedCount.Should().Be(1);
        email.Status.Should().Be(EmailDeliveryStatus.Sent);
        email.SentAt.Should().NotBeNull();
        email.LockedBy.Should().BeNull();

        _emailSenderMock.Verify(
            s => s.SendEmailAsync("user@test.com", "Test Subject", "Test Body", $"email:{deliveryId}", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessPendingEmailsBatchAsync_WhenSenderThrows_IncrementsRetryAndSetsNextAttemptAt()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        var email = new EmailDelivery
        {
            Id = deliveryId,
            NotificationId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ToEmail = "user@test.com",
            Subject = "Test Subject",
            Body = "Test Body",
            Status = EmailDeliveryStatus.Pending,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        var emailList = new List<EmailDelivery> { email };
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailList).Object);

        _emailSenderMock
            .Setup(s => s.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("SMTP connection refused"));

        var job = new EmailDeliveryJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingEmailsBatchAsync(CancellationToken.None);

        // Assert
        processedCount.Should().Be(1);
        email.Status.Should().Be(EmailDeliveryStatus.Pending);
        email.RetryCount.Should().Be(1);
        email.NextAttemptAt.Should().NotBeNull();
        email.NextAttemptAt!.Value.Should().BeAfter(DateTime.UtcNow.AddMilliseconds(-100));
        email.LastError.Should().Contain("SMTP connection refused");
        email.LockedBy.Should().BeNull();
    }

    [Fact]
    public async Task ProcessPendingEmailsBatchAsync_WhenMaxRetriesExceeded_TransitionsToFailed()
    {
        // Arrange
        var deliveryId = Guid.NewGuid();
        var email = new EmailDelivery
        {
            Id = deliveryId,
            NotificationId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ToEmail = "user@test.com",
            Subject = "Test Subject",
            Body = "Test Body",
            Status = EmailDeliveryStatus.Pending,
            RetryCount = 4, // 5th attempt will fail
            CreatedAt = DateTime.UtcNow
        };

        var emailList = new List<EmailDelivery> { email };
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailList).Object);

        _emailSenderMock
            .Setup(s => s.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Mailbox not found"));

        var job = new EmailDeliveryJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingEmailsBatchAsync(CancellationToken.None);

        // Assert
        processedCount.Should().Be(1);
        email.Status.Should().Be(EmailDeliveryStatus.Failed);
        email.RetryCount.Should().Be(5);
        email.LockedBy.Should().BeNull();
    }
}
