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

namespace TutorHub.Application.UnitTests.Features.Reminders;

public class ReminderEventNotificationTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ILogger<BusinessEventNotificationHandler>> _loggerMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();

    [Fact]
    public async Task Handle_SessionReminderDueEvent_CreatesNotificationsAndEmailsForBothParticipants()
    {
        // Arrange
        var studentUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@test.com",
            FullName = "Student Test",
            Role = UserRole.Student
        };
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            FullName = "Tutor Test",
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
            StubClock.Instance,
            _loggerMock.Object,
            _notificationServiceMock.Object);

        var sessionId = Guid.NewGuid();
        var domainEvent = new SessionReminderDueEvent(
            SessionId: sessionId,
            EnrollmentId: Guid.NewGuid(),
            StudentUserId: studentUser.Id,
            TutorUserId: tutorUser.Id,
            StartAt: DateTime.UtcNow.AddHours(24)
        );

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert

        notifications.Should().HaveCount(2);
        notifications.Select(n => n.UserId).Should().Contain(new[] { studentUser.Id, tutorUser.Id });
        notifications.All(n => n.Type == BusinessEventTypes.SessionReminderDue).Should().BeTrue();

        emailDeliveries.Should().HaveCount(2);
        emailDeliveries.Select(e => e.ToEmail).Should().Contain(new[] { "student@test.com", "tutor@test.com" });
        emailDeliveries.All(e => e.Status == EmailDeliveryStatus.Pending).Should().BeTrue();
    }

    [Fact]
    public async Task Handle_GracePeriodClosingSoonEvent_CreatesNotificationAndEmailForStudent()
    {
        // Arrange
        var studentUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@test.com",
            FullName = "Student Test",
            Role = UserRole.Student
        };
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            FullName = "Tutor Test",
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
            StubClock.Instance,
            _loggerMock.Object,
            _notificationServiceMock.Object);

        var sessionId = Guid.NewGuid();
        var domainEvent = new GracePeriodClosingSoonEvent(
            SessionId: sessionId,
            EnrollmentId: Guid.NewGuid(),
            StudentUserId: studentUser.Id,
            TutorUserId: tutorUser.Id,
            SessionNumber: 2,
            GracePeriodEndsAt: DateTime.UtcNow.AddHours(2)
        );

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert

        notifications.Should().HaveCount(1);
        notifications[0].UserId.Should().Be(studentUser.Id);
        notifications[0].Type.Should().Be(BusinessEventTypes.GracePeriodClosingSoon);

        emailDeliveries.Should().HaveCount(1);
        emailDeliveries[0].ToEmail.Should().Be("student@test.com");
    }

    [Fact]
    public async Task Handle_WhenAlreadyProcessed_SkipsExecution()
    {
        // Arrange
        var existingEventId = Guid.NewGuid();
        var users = new List<User>();
        var inboxMessages = new List<InboxMessage>();
        var notifications = new List<Notification>
        {
            new() { Id = Guid.NewGuid(), EventId = existingEventId, UserId = Guid.NewGuid(), Title = "Old", Message = "Old", Type = "Test", DeduplicationKey = $"event:{existingEventId}" }
        };
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _dbContextMock.Setup(c => c.InboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(inboxMessages).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var handler = new BusinessEventNotificationHandler(
            _dbContextMock.Object,
            StubClock.Instance,
            _loggerMock.Object,
            _notificationServiceMock.Object);

        var domainEvent = new SessionReminderDueEvent(
            SessionId: Guid.NewGuid(),
            EnrollmentId: Guid.NewGuid(),
            StudentUserId: Guid.NewGuid(),
            TutorUserId: Guid.NewGuid(),
            StartAt: DateTime.UtcNow.AddHours(24),
            EventId: existingEventId
        );

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        notifications.Should().HaveCount(1);
        emailDeliveries.Should().BeEmpty();
    }
}
