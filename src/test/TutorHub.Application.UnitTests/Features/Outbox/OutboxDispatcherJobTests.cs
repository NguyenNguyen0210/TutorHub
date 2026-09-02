using System.Text.Json;
using FluentAssertions;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.BackgroundServices;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Outbox;

public class OutboxDispatcherJobTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<IPublisher> _publisherMock = new();
    private readonly Mock<ILogger<OutboxDispatcherJob>> _loggerMock = new();
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock = new();
    private readonly Mock<IServiceScope> _scopeMock = new();
    private readonly Mock<IServiceProvider> _serviceProviderMock = new();

    public OutboxDispatcherJobTests()
    {
        _scopeFactoryMock.Setup(s => s.CreateScope()).Returns(_scopeMock.Object);
        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IAppDbContext))).Returns(_dbContextMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IPublisher))).Returns(_publisherMock.Object);
    }

    [Fact]
    public async Task ProcessPendingMessagesBatchAsync_WhenPendingMessageExists_DispatchesAndMarksProcessed()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var tutorUserId = Guid.NewGuid();
        var domainEvent = new TutorApplicationSubmittedEvent(appId, tutorUserId, eventId);

        var payload = JsonSerializer.Serialize(domainEvent, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            EventType = BusinessEventTypes.TutorApplicationSubmitted,
            EventVersion = 1,
            AggregateType = "TutorApplication",
            AggregateId = appId,
            Payload = payload,
            OccurredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = OutboxMessageStatus.Pending
        };

        var outboxList = new List<OutboxMessage> { outboxMessage };
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxList).Object);

        var job = new OutboxDispatcherJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingMessagesBatchAsync(CancellationToken.None);

        // Assert (INV-EVENT-002, INV-EVENT-010, INV-EVENT-011)
        processedCount.Should().Be(1);
        outboxMessage.Status.Should().Be(OutboxMessageStatus.Processed);
        outboxMessage.ProcessedAt.Should().NotBeNull();
        outboxMessage.LockedBy.Should().BeNull();

        _publisherMock.Verify(
            p => p.Publish(It.Is<object>(obj => obj is TutorApplicationSubmittedEvent && ((TutorApplicationSubmittedEvent)obj).ApplicationId == appId && ((TutorApplicationSubmittedEvent)obj).TutorUserId == tutorUserId), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessPendingMessagesBatchAsync_WhenPublishFails_IncrementsRetryCountAndSetsNextAttemptAt()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var domainEvent = new TutorApplicationSubmittedEvent(appId, Guid.NewGuid(), eventId);
        var payload = JsonSerializer.Serialize(domainEvent, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            EventType = BusinessEventTypes.TutorApplicationSubmitted,
            EventVersion = 1,
            AggregateType = "TutorApplication",
            AggregateId = appId,
            Payload = payload,
            OccurredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = OutboxMessageStatus.Pending,
            RetryCount = 0
        };

        var outboxList = new List<OutboxMessage> { outboxMessage };
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxList).Object);

        _publisherMock
            .Setup(p => p.Publish(It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated transient transport failure"));

        var job = new OutboxDispatcherJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingMessagesBatchAsync(CancellationToken.None);

        // Assert (DEC-S7-015: Exponential backoff on retry)
        processedCount.Should().Be(1);
        outboxMessage.Status.Should().Be(OutboxMessageStatus.Pending);
        outboxMessage.RetryCount.Should().Be(1);
        outboxMessage.NextAttemptAt.Should().NotBeNull();
        outboxMessage.NextAttemptAt!.Value.Should().BeAfter(DateTime.UtcNow.AddMilliseconds(-100));
        outboxMessage.LastError.Should().Contain("Simulated transient transport failure");
        outboxMessage.LockedBy.Should().BeNull();
    }

    [Fact]
    public async Task ProcessPendingMessagesBatchAsync_WhenReachesMaxRetries_TransitionsToDeadLettered()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var domainEvent = new TutorApplicationSubmittedEvent(appId, Guid.NewGuid(), eventId);
        var payload = JsonSerializer.Serialize(domainEvent, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            EventType = BusinessEventTypes.TutorApplicationSubmitted,
            EventVersion = 1,
            AggregateType = "TutorApplication",
            AggregateId = appId,
            Payload = payload,
            OccurredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = OutboxMessageStatus.Pending,
            RetryCount = 4 // 4 previous retries, 5th attempt will fail
        };

        var outboxList = new List<OutboxMessage> { outboxMessage };
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxList).Object);

        _publisherMock
            .Setup(p => p.Publish(It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Fatal error"));

        var job = new OutboxDispatcherJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingMessagesBatchAsync(CancellationToken.None);

        // Assert (DEC-S7-013, INV-EVENT-013: Max retries transition to DeadLettered)
        processedCount.Should().Be(1);
        outboxMessage.Status.Should().Be(OutboxMessageStatus.DeadLettered);
        outboxMessage.DeadLetteredAt.Should().NotBeNull();
        outboxMessage.RetryCount.Should().Be(5);
        outboxMessage.LockedBy.Should().BeNull();
    }

    [Fact]
    public async Task ProcessPendingMessagesBatchAsync_WhenNextAttemptAtIsInFuture_SkipsMessage()
    {
        // Arrange
        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventId = Guid.NewGuid(),
            EventType = BusinessEventTypes.TutorApplicationSubmitted,
            Payload = "{}",
            Status = OutboxMessageStatus.Pending,
            NextAttemptAt = DateTime.UtcNow.AddMinutes(5) // In the future
        };

        var outboxList = new List<OutboxMessage> { outboxMessage };
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxList).Object);

        var job = new OutboxDispatcherJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var processedCount = await job.ProcessPendingMessagesBatchAsync(CancellationToken.None);

        // Assert
        processedCount.Should().Be(0);
        outboxMessage.Status.Should().Be(OutboxMessageStatus.Pending);
        _publisherMock.Verify(p => p.Publish(It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
