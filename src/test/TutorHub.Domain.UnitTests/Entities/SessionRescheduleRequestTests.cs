using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class SessionRescheduleRequestTests
{
    [Fact]
    public void Create_InitializesProposal_InPendingStateWithImmutableProperties()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var tutorUserId = Guid.NewGuid();
        var studentUserId = Guid.NewGuid();
        var proposedStart = DateTime.UtcNow.AddDays(2);
        var proposedEnd = proposedStart.AddHours(1);
        var reason = "Tutor has a university conference";
        var now = DateTime.UtcNow;

        // Act
        var request = SessionRescheduleRequest.Create(
            sessionId,
            tutorUserId,
            studentUserId,
            proposedStart,
            proposedEnd,
            reason,
            now);

        // Assert
        request.Id.Should().NotBeEmpty();
        request.SessionId.Should().Be(sessionId);
        request.ProposerUserId.Should().Be(tutorUserId);
        request.RecipientUserId.Should().Be(studentUserId);
        request.ProposedStartAt.Should().Be(proposedStart);
        request.ProposedEndAt.Should().Be(proposedEnd);
        request.Reason.Should().Be(reason);
        request.Status.Should().Be(RescheduleRequestStatus.Pending);
        request.RejectionReason.Should().BeNull();
        request.CreatedAt.Should().Be(now);
        request.RespondedAt.Should().BeNull();
    }

    [Fact]
    public void Accept_ByRecipient_TransitionsToAccepted()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var request = SessionRescheduleRequest.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            studentUserId,
            DateTime.UtcNow.AddDays(2),
            DateTime.UtcNow.AddDays(2).AddHours(1),
            "Schedule conflict",
            DateTime.UtcNow);

        var responseTime = DateTime.UtcNow.AddHours(1);

        // Act
        request.Accept(studentUserId, responseTime);

        // Assert
        request.Status.Should().Be(RescheduleRequestStatus.Accepted);
        request.RespondedAt.Should().Be(responseTime);
    }

    [Fact]
    public void Accept_ByNonRecipient_ThrowsInvalidOperationException()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var wrongUserId = Guid.NewGuid();
        var request = SessionRescheduleRequest.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            studentUserId,
            DateTime.UtcNow.AddDays(2),
            DateTime.UtcNow.AddDays(2).AddHours(1),
            "Schedule conflict",
            DateTime.UtcNow);

        // Act
        var act = () => request.Accept(wrongUserId, DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only the Student recipient can accept*");
    }

    [Fact]
    public void Reject_ByRecipient_TransitionsToRejectedWithReason()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var request = SessionRescheduleRequest.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            studentUserId,
            DateTime.UtcNow.AddDays(2),
            DateTime.UtcNow.AddDays(2).AddHours(1),
            "Schedule conflict",
            DateTime.UtcNow);

        var responseTime = DateTime.UtcNow.AddHours(1);

        // Act
        request.Reject(studentUserId, "I have an exam at that time", responseTime);

        // Assert
        request.Status.Should().Be(RescheduleRequestStatus.Rejected);
        request.RejectionReason.Should().Be("I have an exam at that time");
        request.RespondedAt.Should().Be(responseTime);
    }

    [Fact]
    public void Reject_ByNonRecipient_ThrowsInvalidOperationException()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var wrongUserId = Guid.NewGuid();
        var request = SessionRescheduleRequest.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            studentUserId,
            DateTime.UtcNow.AddDays(2),
            DateTime.UtcNow.AddDays(2).AddHours(1),
            "Schedule conflict",
            DateTime.UtcNow);

        // Act
        var act = () => request.Reject(wrongUserId, "Unavailable", DateTime.UtcNow);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only the Student recipient can reject*");
    }

    [Fact]
    public void TerminalStates_CannotBeAcceptedOrRejectedAgain()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var request = SessionRescheduleRequest.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            studentUserId,
            DateTime.UtcNow.AddDays(2),
            DateTime.UtcNow.AddDays(2).AddHours(1),
            "Schedule conflict",
            DateTime.UtcNow);

        request.Accept(studentUserId, DateTime.UtcNow);

        // Act & Assert: Cannot Accept again
        var actAcceptAgain = () => request.Accept(studentUserId, DateTime.UtcNow);
        actAcceptAgain.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot accept request in 'Accepted' status*");

        // Act & Assert: Cannot Reject after Accepted
        var actReject = () => request.Reject(studentUserId, "Change my mind", DateTime.UtcNow);
        actReject.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot reject request in 'Accepted' status*");
    }
}
