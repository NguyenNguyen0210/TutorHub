using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class SessionAttendanceWindowTests
{
    [Fact]
    public void TryOpenAttendanceVerificationWindow_WhenScheduledAndEnded_OpensWindowSuccessfully()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var session = new Session
        {
            Id = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 200_000m,
            CreatedAt = now.AddDays(-1)
        };
        session.Schedule(now.AddHours(-2), now.AddHours(-1)); // Ended 1 hour ago

        var windowDuration = TimeSpan.FromHours(24);

        // Act
        var result = session.TryOpenAttendanceVerificationWindow(now, windowDuration);

        // Assert (DEC-S7-014, INV-EVENT-014)
        result.Should().BeTrue();
        session.AttendanceVerificationOpenedAt.Should().Be(now);
        session.AttendanceVerificationDueAt.Should().Be(now.Add(windowDuration));
    }

    [Fact]
    public void TryOpenAttendanceVerificationWindow_WhenAlreadyOpened_ReturnsFalse()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var session = new Session
        {
            Id = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 200_000m,
            CreatedAt = now.AddDays(-1)
        };
        session.Schedule(now.AddHours(-2), now.AddHours(-1));

        session.TryOpenAttendanceVerificationWindow(now.AddMinutes(-30), TimeSpan.FromHours(24));
        var initialOpenedAt = session.AttendanceVerificationOpenedAt;

        // Act
        var result = session.TryOpenAttendanceVerificationWindow(now, TimeSpan.FromHours(24));

        // Assert (Exactly once transition)
        result.Should().BeFalse();
        session.AttendanceVerificationOpenedAt.Should().Be(initialOpenedAt);
    }

    [Fact]
    public void TryOpenAttendanceVerificationWindow_WhenSessionHasNotEnded_ReturnsFalse()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var session = new Session
        {
            Id = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 200_000m,
            CreatedAt = now.AddDays(-1)
        };
        session.Schedule(now.AddMinutes(-30), now.AddMinutes(30)); // Ends in future

        // Act
        var result = session.TryOpenAttendanceVerificationWindow(now, TimeSpan.FromHours(24));

        // Assert
        result.Should().BeFalse();
        session.AttendanceVerificationOpenedAt.Should().BeNull();
    }
}
