using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class CustomAgreementTests
{
    private readonly Guid _tutorProfileId = Guid.NewGuid();
    private readonly Guid _studentProfileId = Guid.NewGuid();

    private CustomAgreement CreateSampleAgreement(DateTime? expiresAt = null)
    {
        return new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = _tutorProfileId,
            StudentProfileId = _studentProfileId,
            SubjectId = Guid.NewGuid(),
            Title = "Math tutoring",
            Description = "Custom offer for 10 sessions",
            TotalPrice = 2000000m,
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = CustomAgreementStatus.Proposed,
            ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public void Accept_WhenProposedAndValid_TransitionsToAccepted()
    {
        var agreement = CreateSampleAgreement();

        agreement.Accept(_studentProfileId);

        agreement.Status.Should().Be(CustomAgreementStatus.Accepted);
        agreement.AcceptedAt.Should().NotBeNull();
    }

    [Fact]
    public void Accept_WhenWrongStudent_ThrowsInvalidOperationException()
    {
        var agreement = CreateSampleAgreement();
        var wrongStudentId = Guid.NewGuid();

        var act = () => agreement.Accept(wrongStudentId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*designated student*");
    }

    [Fact]
    public void Accept_WhenExpired_TransitionsToExpiredAndThrows()
    {
        var agreement = CreateSampleAgreement(expiresAt: DateTime.UtcNow.AddMinutes(-5));

        var act = () => agreement.Accept(_studentProfileId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*expired*");
        agreement.Status.Should().Be(CustomAgreementStatus.Expired);
    }

    [Fact]
    public void Accept_WhenAlreadyAccepted_ThrowsInvalidOperationException()
    {
        var agreement = CreateSampleAgreement();
        agreement.Accept(_studentProfileId);

        var act = () => agreement.Accept(_studentProfileId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*current status 'Accepted'*");
    }

    [Fact]
    public void Reject_WhenValid_TransitionsToRejected()
    {
        var agreement = CreateSampleAgreement();

        agreement.Reject(_studentProfileId, "Schedule does not fit my calendar");

        agreement.Status.Should().Be(CustomAgreementStatus.Rejected);
        agreement.RejectedAt.Should().NotBeNull();
        agreement.RejectionReason.Should().Be("Schedule does not fit my calendar");
    }

    [Fact]
    public void Reject_WhenWrongStudent_ThrowsInvalidOperationException()
    {
        var agreement = CreateSampleAgreement();

        var act = () => agreement.Reject(Guid.NewGuid(), "Wrong");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*designated student*");
    }

    [Fact]
    public void Reject_WhenReasonEmpty_ThrowsArgumentException()
    {
        var agreement = CreateSampleAgreement();

        var act = () => agreement.Reject(_studentProfileId, "   ");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*rejection reason is required*");
    }

    [Fact]
    public void Cancel_WhenValid_TransitionsToCancelled()
    {
        var agreement = CreateSampleAgreement();

        agreement.Cancel(_tutorProfileId, "Need to adjust terms");

        agreement.Status.Should().Be(CustomAgreementStatus.Cancelled);
        agreement.CancelledAt.Should().NotBeNull();
        agreement.CancellationReason.Should().Be("Need to adjust terms");
    }

    [Fact]
    public void Cancel_WhenWrongTutor_ThrowsInvalidOperationException()
    {
        var agreement = CreateSampleAgreement();

        var act = () => agreement.Cancel(Guid.NewGuid(), "Cancelled");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*proposing tutor*");
    }

    [Fact]
    public void Cancel_WhenReasonEmpty_ThrowsArgumentException()
    {
        var agreement = CreateSampleAgreement();

        var act = () => agreement.Cancel(_tutorProfileId, "");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*cancellation reason is required*");
    }

    [Fact]
    public void CheckAndApplyExpiration_WhenOverdue_TransitionsToExpired()
    {
        var agreement = CreateSampleAgreement(expiresAt: DateTime.UtcNow.AddHours(-1));

        agreement.CheckAndApplyExpiration();

        agreement.Status.Should().Be(CustomAgreementStatus.Expired);
    }
}
