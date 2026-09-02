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

public class AttendanceVerificationJobTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ILogger<AttendanceVerificationJob>> _loggerMock = new();
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock = new();
    private readonly Mock<IServiceScope> _scopeMock = new();
    private readonly Mock<IServiceProvider> _serviceProviderMock = new();

    public AttendanceVerificationJobTests()
    {
        _scopeFactoryMock.Setup(s => s.CreateScope()).Returns(_scopeMock.Object);
        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(IAppDbContext))).Returns(_dbContextMock.Object);
    }

    [Fact]
    public async Task ProcessAttendanceVerificationWindowsAsync_WhenSessionEnded_OpensWindowAndEnqueuesOutbox()
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
            EarningAmount = 200_000m,
            CreatedAt = now.AddDays(-1)
        };
        session.Schedule(now.AddHours(-2), now.AddHours(-1)); // Ended 1 hour ago

        var sessions = new List<Session> { session };
        var outboxMessages = new List<OutboxMessage>();

        _dbContextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxMessages).Object);

        var job = new AttendanceVerificationJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var count = await job.ProcessAttendanceVerificationWindowsAsync(CancellationToken.None);

        // Assert (DEC-S7-014, INV-EVENT-014)
        count.Should().Be(1);
        session.AttendanceVerificationOpenedAt.Should().BeCloseTo(now, TimeSpan.FromSeconds(2));
        session.AttendanceVerificationDueAt.Should().BeCloseTo(now.AddHours(24), TimeSpan.FromSeconds(2));

        outboxMessages.Should().HaveCount(1);
        outboxMessages[0].EventType.Should().Be("AttendanceVerificationRequired");
    }

    [Fact]
    public async Task ProcessAttendanceVerificationWindowsAsync_WhenWindowExpiredWithoutBothAttended_FlagsConflict()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var session = new Session
        {
            Id = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 200_000m,
            CreatedAt = now.AddDays(-3)
        };
        session.Schedule(now.AddDays(-3), now.AddDays(-2)); // Ended 2 days ago
        session.TryOpenAttendanceVerificationWindow(now.AddDays(-2), TimeSpan.FromHours(24)); // Opened 2 days ago, due was 1 day ago

        var sessions = new List<Session> { session };

        _dbContextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessions).Object);
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(new List<OutboxMessage>()).Object);

        var job = new AttendanceVerificationJob(_scopeFactoryMock.Object, _loggerMock.Object);

        // Act
        var count = await job.ProcessAttendanceVerificationWindowsAsync(CancellationToken.None);

        // Assert (PRD §14, DEC-S7-021: Expired verification flags conflict without completing or releasing earnings)
        count.Should().Be(1);
        session.HasAttendanceConflict.Should().BeTrue();
        session.CompletedAt.Should().BeNull();
        session.IsPayoutReleased.Should().BeFalse();
    }
}
