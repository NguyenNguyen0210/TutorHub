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

namespace TutorHub.Application.UnitTests.Features.Reminders;

public class SessionReminderJobTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ILogger<SessionReminderJob>> _loggerMock = new();
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock = new();
    private readonly Mock<IServiceScope> _scopeMock = new();
    private readonly Mock<IServiceProvider> _serviceProviderMock = new();

    public SessionReminderJobTests()
    {
        _scopeFactoryMock.Setup(s => s.CreateScope()).Returns(_scopeMock.Object);
        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IAppDbContext))).Returns(_dbContextMock.Object);
    }

    [Fact]
    public async Task ProcessDueSessionRemindersAsync_WhenSessionStartsInLessThan24Hours_SendsRemindersForBothParticipants()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var startAt = now.AddHours(12); // Within 24h window
        var endAt = startAt.AddHours(1);

        var studentUser = new User { Id = Guid.NewGuid(), Email = "student@test.com", FullName = "Student", Role = UserRole.Student };
        var tutorUser = new User { Id = Guid.NewGuid(), Email = "tutor@test.com", FullName = "Tutor", Role = UserRole.Tutor };

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            Enrollment = enrollment,
            EnrollmentId = enrollment.Id,
            SessionNumber = 1,
            EarningAmount = 200_000m,
            CreatedAt = now.AddDays(-1)
        };
        session.Schedule(startAt, endAt);

        var sessions = new List<Session> { session };
        var notifications = new List<Notification>();
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var job = new SessionReminderJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var count = await job.ProcessDueSessionRemindersAsync(CancellationToken.None);

        // Assert (FR-NOTIF-004, DEC-S7-020)
        count.Should().Be(2);
        notifications.Should().HaveCount(2);
        notifications.Select(n => n.UserId).Should().Contain(new[] { studentUser.Id, tutorUser.Id });
        notifications.All(n => n.Type == "SessionReminder").Should().BeTrue();
        notifications.All(n => n.DeduplicationKey == $"reminder:session:{session.Id}:24h").Should().BeTrue();

        emailDeliveries.Should().HaveCount(2);
        emailDeliveries.Select(e => e.ToEmail).Should().Contain(new[] { "student@test.com", "tutor@test.com" });
    }

    [Fact]
    public async Task ProcessDueSessionRemindersAsync_WhenAlreadyNotified_DoesNotDuplicate()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var startAt = now.AddHours(12);
        var endAt = startAt.AddHours(1);

        var studentUser = new User { Id = Guid.NewGuid(), Email = "student@test.com", FullName = "Student", Role = UserRole.Student };
        var tutorUser = new User { Id = Guid.NewGuid(), Email = "tutor@test.com", FullName = "Tutor", Role = UserRole.Tutor };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser },
            TutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser }
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            Enrollment = enrollment,
            EnrollmentId = enrollment.Id,
            SessionNumber = 1,
            EarningAmount = 200_000m
        };
        session.Schedule(startAt, endAt);

        var dedupKey = $"reminder:session:{session.Id}:24h";

        var existingNotifications = new List<Notification>
        {
            new() { Id = Guid.NewGuid(), UserId = studentUser.Id, Type = "SessionReminder", DeduplicationKey = dedupKey },
            new() { Id = Guid.NewGuid(), UserId = tutorUser.Id, Type = "SessionReminder", DeduplicationKey = dedupKey }
        };

        _dbContextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(existingNotifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(new List<EmailDelivery>()).Object);

        var job = new SessionReminderJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var count = await job.ProcessDueSessionRemindersAsync(CancellationToken.None);

        // Assert
        count.Should().Be(0);
    }
}
