using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Notifications.EventHandlers;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Notifications;

public class BusinessEventNotificationHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ILogger<BusinessEventNotificationHandler>> _loggerMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();

    [Fact]
    public async Task Handle_TutorApplicationSubmittedEvent_InsertsNotificationsForAdmins_AndInboxMessage()
    {
        // Arrange
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@tutorhub.com",
            FullName = "Admin User",
            Role = UserRole.Admin
        };

        var users = new List<User> { adminUser };
        var inboxMessages = new List<InboxMessage>();
        var notifications = new List<Notification>();
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _dbContextMock.Setup(c => c.InboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(inboxMessages).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var handler = new BusinessEventNotificationHandler(
            _dbContextMock.Object,
            _loggerMock.Object,
            _notificationServiceMock.Object);

        var domainEvent = new TutorApplicationSubmittedEvent(
            ApplicationId: Guid.NewGuid(),
            TutorUserId: Guid.NewGuid()
        );

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert (INV-EVENT-006, INV-EVENT-021)
        inboxMessages.Should().HaveCount(1);
        inboxMessages[0].EventId.Should().Be(domainEvent.EventId);
        inboxMessages[0].ConsumerName.Should().Be("NotificationConsumer");

        notifications.Should().HaveCount(1);
        notifications[0].UserId.Should().Be(adminUser.Id);
        notifications[0].Type.Should().Be(BusinessEventTypes.TutorApplicationSubmitted);
        notifications[0].DeduplicationKey.Should().Be($"event:{domainEvent.EventId}");

        emailDeliveries.Should().HaveCount(1);
        emailDeliveries[0].ToEmail.Should().Be("admin@tutorhub.com");
        emailDeliveries[0].Status.Should().Be(EmailDeliveryStatus.Pending);
    }

    [Fact]
    public async Task Handle_WhenInboxMessageAlreadyExists_IsIdempotentAndSkipsProcessing()
    {
        // Arrange
        var existingEventId = Guid.NewGuid();
        var inboxMessages = new List<InboxMessage>
        {
            new() { Id = Guid.NewGuid(), ConsumerName = "NotificationConsumer", EventId = existingEventId, ProcessedAt = DateTime.UtcNow }
        };

        var notifications = new List<Notification>();
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.InboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(inboxMessages).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var handler = new BusinessEventNotificationHandler(
            _dbContextMock.Object,
            _loggerMock.Object,
            _notificationServiceMock.Object);

        var domainEvent = new TutorApplicationSubmittedEvent(
            ApplicationId: Guid.NewGuid(),
            TutorUserId: Guid.NewGuid(),
            EventId: existingEventId
        );

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert (INV-EVENT-004: Deduplication prevents double notification)
        notifications.Should().BeEmpty();
        emailDeliveries.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_EnrollmentActivatedEvent_InsertsNotificationsForBothStudentAndTutor_Atomically()
    {
        // Arrange
        var studentUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@example.com",
            FullName = "Student User",
            Role = UserRole.Student
        };

        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@example.com",
            FullName = "Tutor User",
            Role = UserRole.Tutor
        };

        var users = new List<User> { studentUser, tutorUser };
        var inboxMessages = new List<InboxMessage>();
        var notifications = new List<Notification>();
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _dbContextMock.Setup(c => c.InboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(inboxMessages).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var handler = new BusinessEventNotificationHandler(
            _dbContextMock.Object,
            _loggerMock.Object,
            _notificationServiceMock.Object);

        var domainEvent = new EnrollmentActivatedEvent(
            EnrollmentId: Guid.NewGuid(),
            StudentId: Guid.NewGuid(),
            TutorId: Guid.NewGuid(),
            StudentUserId: studentUser.Id,
            TutorUserId: tutorUser.Id
        );

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert (INV-EVENT-021: Multi-recipient events commit all recipient notifications with 1 InboxMessage)
        inboxMessages.Should().HaveCount(1);
        notifications.Should().HaveCount(2);
        notifications.Select(n => n.UserId).Should().Contain(new[] { studentUser.Id, tutorUser.Id });

        emailDeliveries.Should().HaveCount(2);
        emailDeliveries.Select(e => e.ToEmail).Should().Contain(new[] { "student@example.com", "tutor@example.com" });
    }
}
