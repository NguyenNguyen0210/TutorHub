using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class SessionRescheduleTests
{
    [Fact]
    public void Reschedule_WhenScheduled_UpdatesScheduleAndTimestamp()
    {
        // Arrange
        var initialStart = DateTime.UtcNow.AddDays(1);
        var initialEnd = initialStart.AddHours(1);
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 300_000m
        };
        session.Schedule(initialStart, initialEnd);

        var newStart = DateTime.UtcNow.AddDays(2);
        var newEnd = newStart.AddHours(1);
        var now = DateTime.UtcNow;

        // Act
        session.Reschedule(newStart, newEnd, now);

        // Assert
        session.Status.Should().Be(SessionStatus.Scheduled);
        session.StartAt.Should().Be(newStart);
        session.EndAt.Should().Be(newEnd);
        session.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void Reschedule_WhenUnscheduled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 300_000m
        };
        var newStart = DateTime.UtcNow.AddDays(2);
        var newEnd = newStart.AddHours(1);

        // Act
        var act = () => session.Reschedule(newStart, newEnd, DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Session must be Scheduled*");
    }

    [Fact]
    public void Reschedule_WhenCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 300_000m
        };
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        // Act
        var act = () => session.Reschedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1), DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Session must be Scheduled*");
    }

    [Fact]
    public void Reschedule_WhenCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 300_000m
        };
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.CancelFromEnrollment();

        // Act
        var act = () => session.Reschedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1), DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Session must be Scheduled*");
    }

    [Fact]
    public void Reschedule_WhenEndAtBeforeOrEqualToStartAt_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 300_000m
        };
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));

        var newStart = DateTime.UtcNow.AddDays(2);
        var invalidEnd = newStart; // equal

        // Act
        var act = () => session.Reschedule(newStart, invalidEnd, DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*EndAt must be after StartAt*");
    }
}
