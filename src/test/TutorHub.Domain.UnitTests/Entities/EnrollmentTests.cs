using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class EnrollmentTests
{
    [Fact]
    public void NewEnrollment_DefaultsToActive()
    {
        // Act
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            TotalPrice = 3_500_000m,
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };

        // Assert
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.CompletedSessions.Should().Be(0);
        enrollment.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        enrollment.CompletedAt.Should().BeNull();
        enrollment.CancelledAt.Should().BeNull();
        enrollment.CancellationReason.Should().BeNull();
    }

    [Fact]
    public void RecordCompletedSession_SingleSession_CompletesEnrollment()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 500_000m, totalSessions: 1);
        var session = enrollment.Sessions.First();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        // Act
        enrollment.RecordCompletedSession(session.Id);

        // Assert
        enrollment.CompletedSessions.Should().Be(1);
        enrollment.Status.Should().Be(EnrollmentStatus.Completed);
        enrollment.CompletedAt.Should().NotBeNull();
        enrollment.CompletedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void RecordCompletedSession_PartialCompletion_RemainsActive()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        var session1 = enrollment.Sessions.ElementAt(0);
        session1.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session1.Complete();

        // Act
        enrollment.RecordCompletedSession(session1.Id);

        // Assert
        enrollment.CompletedSessions.Should().Be(1);
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.CompletedAt.Should().BeNull();
    }

    [Fact]
    public void RecordCompletedSession_AllSessionsDone_TransitionsToCompleted()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        foreach (var s in enrollment.Sessions)
        {
            s.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
            s.Complete();
            enrollment.RecordCompletedSession(s.Id);
        }

        // Assert
        enrollment.CompletedSessions.Should().Be(3);
        enrollment.Status.Should().Be(EnrollmentStatus.Completed);
        enrollment.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public void RecordCompletedSession_CountMatchesActualCompletedSessions()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        var session1 = enrollment.Sessions.ElementAt(0);
        var session2 = enrollment.Sessions.ElementAt(1);

        session1.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session1.Complete();
        enrollment.RecordCompletedSession(session1.Id);

        session2.Schedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1));
        session2.Complete();
        enrollment.RecordCompletedSession(session2.Id);

        // Assert
        enrollment.CompletedSessions.Should().Be(2);
        enrollment.CompletedSessions.Should().Be(enrollment.Sessions.Count(s => s.Status == SessionStatus.Completed));
    }

    [Fact]
    public void RecordCompletedSession_WhenEnrollmentCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        var session = enrollment.Sessions.First();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        enrollment.Cancel("Student changed mind");

        // Act
        var act = () => enrollment.RecordCompletedSession(session.Id);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot record session completion for an enrollment in 'Cancelled' status.");
    }

    [Fact]
    public void RecordCompletedSession_WhenEnrollmentCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 500_000m, totalSessions: 1);
        var session = enrollment.Sessions.First();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();
        enrollment.RecordCompletedSession(session.Id);

        // Act
        var act = () => enrollment.RecordCompletedSession(session.Id);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot record session completion for an enrollment in 'Completed' status.");
    }

    [Fact]
    public void RecordCompletedSession_WithUnknownSessionId_ThrowsInvalidOperationException()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        var unknownSessionId = Guid.NewGuid();

        // Act
        var act = () => enrollment.RecordCompletedSession(unknownSessionId);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Session '{unknownSessionId}' does not belong to this enrollment.");
    }

    [Fact]
    public void RecordCompletedSession_WhenSessionNotCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        var session = enrollment.Sessions.First();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));

        // Act
        var act = () => enrollment.RecordCompletedSession(session.Id);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Session '{session.Id}' is not in Completed status. Cannot record completion.");
    }

    [Fact]
    public void RecordCompletedSession_DoesNotDoubleCount()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        var session = enrollment.Sessions.First();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();

        enrollment.RecordCompletedSession(session.Id);
        enrollment.CompletedSessions.Should().Be(1);

        // Act - re-recording the same completed session
        enrollment.RecordCompletedSession(session.Id);

        // Assert - count must remain 1, not 2
        enrollment.CompletedSessions.Should().Be(1);
    }

    [Fact]
    public void Cancel_FromActive_TransitionsToCancelled()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);

        // Act
        var refund = enrollment.Cancel("Schedule conflict");

        // Assert
        enrollment.Status.Should().Be(EnrollmentStatus.Cancelled);
        enrollment.CancelledAt.Should().NotBeNull();
        enrollment.CancelledAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        enrollment.CancellationReason.Should().Be("Schedule conflict");
        enrollment.CancelledBy.Should().BeNull();
    }

    [Fact]
    public void Cancel_WithCancelledBy_SetsCancelledByCorrectly()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);

        // Act
        var refund = enrollment.Cancel("Tutor unable to teach", CancelledBy.Tutor);

        // Assert
        enrollment.Status.Should().Be(EnrollmentStatus.Cancelled);
        enrollment.CancellationReason.Should().Be("Tutor unable to teach");
        enrollment.CancelledBy.Should().Be(CancelledBy.Tutor);
    }

    [Fact]
    public void Cancel_FromCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 500_000m, totalSessions: 1);
        var session = enrollment.Sessions.First();
        session.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session.Complete();
        enrollment.RecordCompletedSession(session.Id);

        // Act
        var act = () => enrollment.Cancel("Trying to cancel completed");

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel an enrollment in 'Completed' status.");
    }

    [Fact]
    public void Cancel_FromCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        enrollment.Cancel("First cancel");

        // Act
        var act = () => enrollment.Cancel("Second cancel");

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel an enrollment in 'Cancelled' status.");
    }

    [Fact]
    public void Cancel_RefundAmount_EqualsUncompletedEarnings()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);
        // Allocations: [333_333, 333_333, 333_334]
        var session1 = enrollment.Sessions.ElementAt(0);
        session1.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        session1.Complete();
        enrollment.RecordCompletedSession(session1.Id);

        // Act
        var refund = enrollment.Cancel("Student cancelled remaining");

        // Assert
        // TotalPrice (1_000_000) - Session1 (333_333) = 666_667
        refund.Should().Be(666_667m);
    }

    [Fact]
    public void Cancel_RefundAmount_WhenZeroCompleted_EqualsFullPrice()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 3);

        // Act
        var refund = enrollment.Cancel("Immediate cancel");

        // Assert
        refund.Should().Be(1_000_000m);
    }

    [Fact]
    public void Cancel_CancelsAllNonCompletedSessions()
    {
        // Arrange
        var enrollment = CreateEnrollmentWithSessions(totalPrice: 1_000_000m, totalSessions: 4);
        var s1 = enrollment.Sessions.ElementAt(0);
        var s2 = enrollment.Sessions.ElementAt(1);
        var s3 = enrollment.Sessions.ElementAt(2);
        var s4 = enrollment.Sessions.ElementAt(3);

        s1.Schedule(DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(1));
        s1.Complete();
        enrollment.RecordCompletedSession(s1.Id);

        s2.Schedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1));
        s3.Schedule(DateTime.UtcNow.AddDays(3), DateTime.UtcNow.AddDays(3).AddHours(1));
        // s4 is Unscheduled

        // Act
        enrollment.Cancel("Cancel rest");

        // Assert
        s1.Status.Should().Be(SessionStatus.Completed);
        s2.Status.Should().Be(SessionStatus.Cancelled);
        s3.Status.Should().Be(SessionStatus.Cancelled);
        s4.Status.Should().Be(SessionStatus.Cancelled);
    }

    private static Enrollment CreateEnrollmentWithSessions(decimal totalPrice, int totalSessions)
    {
        var enrollmentId = Guid.NewGuid();
        var allocations = EnrollmentSessionAllocator.Allocate(totalPrice, totalSessions);

        var sessions = new List<Session>();
        for (var i = 0; i < totalSessions; i++)
        {
            sessions.Add(new Session
            {
                Id = Guid.NewGuid(),
                EnrollmentId = enrollmentId,
                SessionNumber = i + 1,
                EarningAmount = allocations[i]
            });
        }

        return new Enrollment
        {
            Id = enrollmentId,
            BookingId = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            TotalPrice = totalPrice,
            TotalSessions = totalSessions,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Sessions = sessions
        };
    }
}
