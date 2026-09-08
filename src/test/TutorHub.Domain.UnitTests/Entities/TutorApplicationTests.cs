using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class TutorApplicationTests
{
    private static TutorApplication CreatePendingApplication() => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        Bio = "Sample bio",
        Education = "Sample education",
        ExperienceYears = 3,
        TeachingMode = TeachingMode.Online,
        SubmittedAt = DateTime.UtcNow
        // Status defaults to Pending
    };

    // ── Default State ──────────────────────────────────────────────────

    [Fact]
    public void NewApplication_ShouldHavePendingStatus()
    {
        var application = new TutorApplication();
        application.Status.Should().Be(TutorApplicationStatus.Pending);
    }

    // ── Approve ────────────────────────────────────────────────────────

    [Fact]
    public void Approve_FromPending_ShouldSetApproved()
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();

        application.Approve(adminId);

        application.Status.Should().Be(TutorApplicationStatus.Approved);
        application.ReviewedByAdminId.Should().Be(adminId);
        application.ReviewedAt.Should().NotBeNull();
        application.RejectionReason.Should().BeNull();
    }

    [Fact]
    public void Approve_FromApproved_ShouldThrow()
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();
        application.Approve(adminId);

        var act = () => application.Approve(adminId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be approved*");
    }

    [Fact]
    public void Approve_FromRejected_ShouldThrow()
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();
        application.Reject("Not qualified", adminId);

        var act = () => application.Approve(adminId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be approved*");
    }

    // ── Reject ─────────────────────────────────────────────────────────

    [Fact]
    public void Reject_FromPending_WithReason_ShouldSetRejected()
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();

        application.Reject("Missing qualifications", adminId);

        application.Status.Should().Be(TutorApplicationStatus.Rejected);
        application.RejectionReason.Should().Be("Missing qualifications");
        application.ReviewedByAdminId.Should().Be(adminId);
        application.ReviewedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Reject_WithEmptyOrNullReason_ShouldThrow(string? reason)
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();

        var act = () => application.Reject(reason!, adminId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Rejection reason is required*");
    }

    [Fact]
    public void Reject_FromApproved_ShouldThrow()
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();
        application.Approve(adminId);

        var act = () => application.Reject("Changed mind", adminId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be rejected*");
    }

    [Fact]
    public void Reject_FromRejected_ShouldThrow()
    {
        var adminId = Guid.NewGuid();
        var application = CreatePendingApplication();
        application.Reject("First rejection", adminId);

        var act = () => application.Reject("Second rejection", adminId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be rejected*");
    }
}
