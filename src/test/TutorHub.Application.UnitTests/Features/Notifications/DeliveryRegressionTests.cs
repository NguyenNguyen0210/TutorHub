using System.Reflection;
using System.Text.Json;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Notifications.EventHandlers;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Services;

namespace TutorHub.Application.UnitTests.Features.Notifications;

public class DeliveryRegressionTests
{
    public static IEnumerable<object[]> BusinessEvents() => typeof(BusinessEventTypes)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(f => f.IsLiteral && f.FieldType == typeof(string))
        .Select(f => new object[] { (string)f.GetRawConstantValue()! });

    [Theory]
    [MemberData(nameof(BusinessEvents))]
    public async Task Dispatcher_CanDispatchEveryDeclaredBusinessEvent(string eventType)
    {
        var item = new OutboxMessage { Id = Guid.NewGuid(), EventId = Guid.NewGuid(),
            EventType = eventType, Payload = "{}", Status = OutboxMessageStatus.Pending, CreatedAt = DateTime.UtcNow };
        var db = new Mock<IAppDbContext>();
        db.SetupGet(d => d.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(new List<OutboxMessage> { item }).Object);
        var publisher = new Mock<IPublisher>();
        var factory = ScopeFactory(db.Object, publisher.Object);
        var job = new OutboxDispatcherJob(factory, NullLogger<OutboxDispatcherJob>.Instance, new SystemClock());
        await job.ProcessPendingMessagesBatchAsync(CancellationToken.None);
        Assert.Equal(OutboxMessageStatus.Processed, item.Status);
        publisher.Verify(p => p.Publish(It.Is<object>(value => ((IBusinessEvent)value).EventType == eventType), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NotificationIsDurable_AndOnlyWorkerSendsEmail_WithRetryAfterTransientFailure()
    {
        var admin = new User { Id = Guid.NewGuid(), Email = "admin@test.local", FullName = "Admin", Role = UserRole.Admin };
        var db = new Mock<IAppDbContext>();
        var notifications = new List<Notification>();
        var deliveries = new List<EmailDelivery>();
        db.SetupGet(d => d.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { admin }).Object);
        db.SetupGet(d => d.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        db.SetupGet(d => d.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(deliveries).Object);
        var sender = new Mock<IEmailSender>();
        sender.SetupSequence(s => s.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("Transient SMTP outage"))
            .Returns(Task.CompletedTask);
        var handler = new BusinessEventNotificationHandler(db.Object, new SystemClock(), NullLogger<BusinessEventNotificationHandler>.Instance);
        var evt = new TutorApplicationSubmittedEvent(Guid.NewGuid(), Guid.NewGuid());
        await handler.Handle(evt, CancellationToken.None);
        await handler.Handle(evt, CancellationToken.None);
        Assert.Single(notifications);
        var delivery = Assert.Single(deliveries);
        Assert.Equal(EmailDeliveryStatus.Pending, delivery.Status);
        sender.VerifyNoOtherCalls();

        var job = new EmailDeliveryJob(ScopeFactory(db.Object, sender.Object), NullLogger<EmailDeliveryJob>.Instance, new SystemClock());
        Assert.Equal(1, await job.ProcessPendingEmailsBatchAsync(CancellationToken.None));
        Assert.Equal(EmailDeliveryStatus.Pending, delivery.Status);
        Assert.Equal(1, delivery.RetryCount);
        Assert.NotNull(delivery.NextAttemptAt);
        delivery.NextAttemptAt = DateTime.UtcNow.AddSeconds(-1);
        Assert.Equal(1, await job.ProcessPendingEmailsBatchAsync(CancellationToken.None));
        Assert.Equal(EmailDeliveryStatus.Sent, delivery.Status);
        Assert.Equal(0, await job.ProcessPendingEmailsBatchAsync(CancellationToken.None));
        sender.Verify(s => s.SendEmailAsync(delivery.ToEmail, delivery.Subject, delivery.Body, $"email:{delivery.Id}", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    private static IServiceScopeFactory ScopeFactory(IAppDbContext db, object service)
    {
        var provider = new Mock<IServiceProvider>();
        provider.Setup(p => p.GetService(typeof(IAppDbContext))).Returns(db);
        provider.Setup(p => p.GetService(typeof(IPublisher))).Returns(service as IPublisher);
        provider.Setup(p => p.GetService(typeof(IEmailSender))).Returns(service as IEmailSender);
        var scope = new Mock<IServiceScope>();
        scope.SetupGet(s => s.ServiceProvider).Returns(provider.Object);
        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(f => f.CreateScope()).Returns(scope.Object);
        return factory.Object;
    }
}
