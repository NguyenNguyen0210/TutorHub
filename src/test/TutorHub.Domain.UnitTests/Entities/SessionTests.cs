using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class SessionTests
{
    [Fact]
    public void NewSession_DefaultsToUnscheduled()
    {
        // Act
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 350_000m
        };

        // Assert
        session.Status.Should().Be(SessionStatus.Unscheduled);
        session.StartAt.Should().BeNull();
        session.EndAt.Should().BeNull();
        session.IsPayoutReleased.Should().BeFalse();
        session.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        session.UpdatedAt.Should().BeNull();
        session.CompletedAt.Should().BeNull();
        session.CancelledAt.Should().BeNull();
    }

    [Fact]
    public void Schedule_FromUnscheduled_TransitionsToScheduled()
    {
        // Arrange
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 350_000m
        };
        var startAt = DateTime.UtcNow.AddDays(1);
        var endAt = startAt.AddHours(1);

        // Act
        session.Schedule(startAt, endAt);

        // Assert
        session.Status.Should().Be(SessionStatus.Scheduled);
        session.StartAt.Should().Be(startAt);
        session.EndAt.Should().Be(endAt);
        session.UpdatedAt.Should().NotBeNull();
        session.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void Schedule_FromScheduled_AllowsReschedule()
    {
        // Arrange
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            SessionNumber = 1,
            EarningAmount = 350_000m
        };
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));

        var newStartAt = DateTime.UtcNow.AddDays(2);
        var newEndAt = newStartAt.AddHours(2);

        // Act
        session.Schedule(newStartAt, newEndAt);

        // Assert
        session.Status.Should().Be(SessionStatus.Scheduled);
        session.StartAt.Should().Be(newStartAt);
        session.EndAt.Should().Be(newEndAt);
    }

    [Fact]
    public void Schedule_EndBeforeStart_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        var startAt = DateTime.UtcNow.AddDays(1);
        var endAt = startAt.AddHours(-1);

        // Act
        var act = () => session.Schedule(startAt, endAt);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Session EndAt must be after StartAt.");
    }

    [Fact]
    public void Schedule_EndEqualsStart_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        var sameTime = DateTime.UtcNow.AddDays(1);

        // Act
        var act = () => session.Schedule(sameTime, sameTime);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Session EndAt must be after StartAt.");
    }

    [Fact]
    public void Schedule_FromCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        // Act
        var act = () => session.Schedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1));

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot reschedule a completed session.");
    }

    [Fact]
    public void Schedule_FromCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        session.CancelFromEnrollment();

        // Act
        var act = () => session.Schedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1));

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot reschedule a cancelled session.");
    }

    [Fact]
    public void Complete_FromScheduled_TransitionsToCompleted()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));

        // Act
        session.Complete();

        // Assert
        session.Status.Should().Be(SessionStatus.Completed);
        session.IsPayoutReleased.Should().BeTrue();
        session.CompletedAt.Should().NotBeNull();
        session.CompletedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        session.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void Complete_SetsIsPayoutReleasedTrue()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));

        // Act
        session.Complete();

        // Assert
        session.IsPayoutReleased.Should().BeTrue();
    }

    [Fact]
    public void Complete_FromUnscheduled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();

        // Act
        var act = () => session.Complete();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot complete a session in 'Unscheduled' status. Session must be Scheduled.");
    }

    [Fact]
    public void Complete_FromCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        session.CancelFromEnrollment();

        // Act
        var act = () => session.Complete();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot complete a session in 'Cancelled' status. Session must be Scheduled.");
    }

    [Fact]
    public void Complete_WhenAlreadyPayoutReleased_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        // Act
        var act = () => session.Complete();

        // Assert
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void CancelFromEnrollment_FromUnscheduled_Cancels()
    {
        // Arrange
        var session = new Session();

        // Act
        session.CancelFromEnrollment();

        // Assert
        session.Status.Should().Be(SessionStatus.Cancelled);
        session.CancelledAt.Should().NotBeNull();
        session.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void CancelFromEnrollment_FromScheduled_Cancels()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));

        // Act
        session.CancelFromEnrollment();

        // Assert
        session.Status.Should().Be(SessionStatus.Cancelled);
        session.CancelledAt.Should().NotBeNull();
    }

    [Fact]
    public void CancelFromEnrollment_FromCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        // Act
        var act = () => session.CancelFromEnrollment();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel a completed session.");
    }

    [Fact]
    public void SubmitStudentAttendance_WhenSessionHasEnded_RecordsAttendance()
    {
        // Arrange
        var session = new Session();
        var pastStart = DateTime.UtcNow.AddHours(-2);
        var pastEnd = DateTime.UtcNow.AddHours(-1);
        session.Schedule(pastStart, pastEnd);
        var now = DateTime.UtcNow;

        // Act
        session.SubmitStudentAttendance(AttendanceStatus.Attended, now);

        // Assert
        session.StudentAttendance.Should().Be(AttendanceStatus.Attended);
        session.StudentAttendanceSubmittedAt.Should().Be(now);
    }

    [Fact]
    public void SubmitStudentAttendance_BeforeSessionEnd_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        var futureStart = DateTime.UtcNow.AddHours(1);
        var futureEnd = DateTime.UtcNow.AddHours(2);
        session.Schedule(futureStart, futureEnd);

        // Act
        var act = () => session.SubmitStudentAttendance(AttendanceStatus.Attended, DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot submit attendance before the session has ended.");
    }

    [Fact]
    public void SubmitAttendance_WhenBothAttended_NoConflictFlagged()
    {
        // Arrange
        var session = new Session();
        var pastStart = DateTime.UtcNow.AddHours(-2);
        var pastEnd = DateTime.UtcNow.AddHours(-1);
        session.Schedule(pastStart, pastEnd);
        var now = DateTime.UtcNow;

        // Act
        session.SubmitStudentAttendance(AttendanceStatus.Attended, now);
        session.SubmitTutorAttendance(AttendanceStatus.Attended, now);

        // Assert
        session.HasAttendanceConflict.Should().BeFalse();
    }

    [Fact]
    public void SubmitAttendance_WhenStudentAbsentAndTutorAttended_FlagsConflict()
    {
        // Arrange
        var session = new Session();
        var pastStart = DateTime.UtcNow.AddHours(-2);
        var pastEnd = DateTime.UtcNow.AddHours(-1);
        session.Schedule(pastStart, pastEnd);
        var now = DateTime.UtcNow;

        // Act
        session.SubmitStudentAttendance(AttendanceStatus.Absent, now);
        session.SubmitTutorAttendance(AttendanceStatus.Attended, now);

        // Assert
        session.HasAttendanceConflict.Should().BeTrue();
    }

    [Fact]
    public void CancelSingle_FromUnscheduled_TransitionsToCancelled()
    {
        // Arrange
        var session = new Session();
        var now = DateTime.UtcNow;

        // Act
        session.CancelSingle("Student requested cancellation", now);

        // Assert
        session.Status.Should().Be(SessionStatus.Cancelled);
        session.ResolutionNotes.Should().Be("Student requested cancellation");
        session.ResolutionSource.Should().Be("SingleSessionCancel");
        session.CancelledAt.Should().Be(now);
    }

    [Fact]
    public void CancelSingle_FromFutureScheduled_TransitionsToCancelled()
    {
        // Arrange
        var session = new Session();
        var now = DateTime.UtcNow;
        session.Schedule(now.AddDays(2), now.AddDays(2).AddHours(1));

        // Act
        session.CancelSingle("Tutor emergency", now);

        // Assert
        session.Status.Should().Be(SessionStatus.Cancelled);
        session.ResolutionNotes.Should().Be("Tutor emergency");
        session.ResolutionSource.Should().Be("SingleSessionCancel");
        session.CancelledAt.Should().Be(now);
    }

    [Fact]
    public void CancelSingle_FromPastScheduled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        var now = DateTime.UtcNow;
        session.Schedule(now.AddDays(-1), now.AddDays(-1).AddHours(1));

        // Act
        var act = () => session.CancelSingle("Trying to cancel past session", now);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel a session that has already started.");
    }

    [Fact]
    public void CancelSingle_FromCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        // Act
        var act = () => session.CancelSingle("Session already completed", DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel a completed session.");
    }

    [Fact]
    public void CancelSingle_FromAlreadyCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var session = new Session();
        var now = DateTime.UtcNow;
        session.CancelSingle("First cancellation", now);

        // Act
        var act = () => session.CancelSingle("Second cancellation", now);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Session is already cancelled.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CancelSingle_WithoutReason_ThrowsArgumentException(string? invalidReason)
    {
        // Arrange
        var session = new Session();

        // Act
        var act = () => session.CancelSingle(invalidReason!, DateTime.UtcNow);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Cancellation reason is required.*");
    }
}

