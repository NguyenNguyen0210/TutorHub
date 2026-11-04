using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.BackgroundServices;

namespace TutorHub.Application.UnitTests.Features.Notifications;

public class WorkerLeaseRegressionTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SlowBatch_ClaimsNextItemWithCurrentTimeAndFreshScope(bool email)
    {
        var now = new DateTime(2026, 11, 4, 10, 0, 0, DateTimeKind.Utc);
        var clock = new Mock<IClock>(); clock.SetupGet(c => c.UtcNow).Returns(() => now);
        var db = new Mock<IAppDbContext>();
        var emails = Enumerable.Range(0, 2).Select(_ => new EmailDelivery { Id = Guid.NewGuid(), Status = EmailDeliveryStatus.Pending, ToEmail = "test@test.local", Subject = "Test", Body = "Test" }).ToList();
        var messages = Enumerable.Range(0, 2).Select(_ => new OutboxMessage { Id = Guid.NewGuid(), EventId = Guid.NewGuid(), Status = OutboxMessageStatus.Pending, EventType = "TutorApplicationSubmitted", Payload = "{}" }).ToList();
        db.SetupGet(d => d.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emails).Object);
        db.SetupGet(d => d.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(messages).Object);
        var sender = new Mock<IEmailSender>(); var publisher = new Mock<IPublisher>(); int calls = 0;
        void CheckLease()
        {
            var lease = email ? emails[calls].LockedUntil : messages[calls].LockedUntil;
            Assert.Equal(now.AddSeconds(60), lease);
            calls++; now = now.AddMinutes(2); // A previous dispatch took longer than the lease.
        }
        sender.Setup(s => s.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback(CheckLease).Returns(Task.CompletedTask);
        publisher.Setup(p => p.Publish(It.IsAny<object>(), It.IsAny<CancellationToken>())).Callback(CheckLease).Returns(Task.CompletedTask);
        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(f => f.CreateScope()).Returns(() =>
        {
            var provider = new Mock<IServiceProvider>();
            provider.Setup(p => p.GetService(typeof(IAppDbContext))).Returns(db.Object);
            provider.Setup(p => p.GetService(typeof(IEmailSender))).Returns(sender.Object);
            provider.Setup(p => p.GetService(typeof(IPublisher))).Returns(publisher.Object);
            var scope = new Mock<IServiceScope>(); scope.SetupGet(s => s.ServiceProvider).Returns(provider.Object);
            return scope.Object;
        });
        var count = email
            ? await new EmailDeliveryJob(factory.Object, NullLogger<EmailDeliveryJob>.Instance, clock.Object).ProcessPendingEmailsBatchAsync(CancellationToken.None)
            : await new OutboxDispatcherJob(factory.Object, NullLogger<OutboxDispatcherJob>.Instance, clock.Object).ProcessPendingMessagesBatchAsync(CancellationToken.None);
        Assert.Equal(2, count); Assert.Equal(2, calls);
        factory.Verify(f => f.CreateScope(), Times.Exactly(3));
    }
}
