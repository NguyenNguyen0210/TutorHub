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

public class AttendanceReminderJobTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ILogger<AttendanceReminderJob>> _loggerMock = new();
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock = new();
    private readonly Mock<IServiceScope> _scopeMock = new();
    private readonly Mock<IServiceProvider> _serviceProviderMock = new();

    public AttendanceReminderJobTests()
    {
        _scopeFactoryMock.Setup(s => s.CreateScope()).Returns(_scopeMock.Object);
        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IAppDbContext))).Returns(_dbContextMock.Object);
    }

    [Fact]
    public async Task ProcessDueAttendanceRemindersAsync_WhenWindowOpenAndUnsubmitted_SendsReminders()
    {
        // Arrange
        var now = DateTime.UtcNow;
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
        session.Schedule(now.AddHours(-2), now.AddHours(-1));
        session.TryOpenAttendanceVerificationWindow(now.AddHours(-1), TimeSpan.FromHours(24)); // Due in 23h

        var sessions = new List<Session> { session };
        var notifications = new List<Notification>();
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var job = new AttendanceReminderJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var count = await job.ProcessDueAttendanceRemindersAsync(CancellationToken.None);

        // Assert (FR-NOTIF-005, DEC-S7-022)
        count.Should().Be(2);
        notifications.Should().HaveCount(2);
        notifications.All(n => n.Type == "AttendanceReminder").Should().BeTrue();
        emailDeliveries.Should().HaveCount(2);
    }

    [Fact]
    public async Task ProcessDueAttendanceRemindersAsync_WhenStudentAlreadySubmitted_OnlyRemindsTutor()
    {
        // Arrange
        var now = DateTime.UtcNow;
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
        session.Schedule(now.AddHours(-2), now.AddHours(-1));
        session.TryOpenAttendanceVerificationWindow(now.AddHours(-1), TimeSpan.FromHours(24));
        session.SubmitStudentAttendance(AttendanceStatus.Attended, now.AddMinutes(-30)); // Student already submitted

        var sessions = new List<Session> { session };
        var notifications = new List<Notification>();
        var emailDeliveries = new List<EmailDelivery>();

        _dbContextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);
        _dbContextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveries).Object);

        var job = new AttendanceReminderJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var count = await job.ProcessDueAttendanceRemindersAsync(CancellationToken.None);

        // Assert
        count.Should().Be(1);
        notifications.Should().HaveCount(1);
        notifications[0].UserId.Should().Be(tutorUser.Id);
    }
}
