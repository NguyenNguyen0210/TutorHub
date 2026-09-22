using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class TopUpRequestTests
{
    private static TopUpRequest CreatePendingRequest(decimal amount = 100_000m) => new()
    {
        Id = Guid.NewGuid(),
        StudentWalletId = Guid.NewGuid(),
        Amount = amount,
        TransferReference = "TUTORHUB NAP A1B2C3D4 7F92",
        Status = TopUpRequestStatus.Pending,
        RequestedAt = DateTime.UtcNow
    };

    [Fact]
    public void Confirm_WhenPending_TransitionsToConfirmed()
    {
        var request = CreatePendingRequest();
        var adminId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        request.Confirm(adminId, now, "Transfer verified");

        request.Status.Should().Be(TopUpRequestStatus.Confirmed);
        request.ProcessedByAdminId.Should().Be(adminId);
        request.ProcessedAt.Should().Be(now);
        request.AdminNote.Should().Be("Transfer verified");
    }

    [Fact]
    public void Confirm_WhenAlreadyConfirmed_ThrowsInvalidOperationException()
    {
        var request = CreatePendingRequest();
        var adminId = Guid.NewGuid();
        request.Confirm(adminId, DateTime.UtcNow);

        var act = () => request.Confirm(adminId, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot confirm top-up request in 'Confirmed' status*");
    }

    [Fact]
    public void Reject_WhenPending_TransitionsToRejected()
    {
        var request = CreatePendingRequest();
        var adminId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        request.Reject(adminId, "Invalid transaction code", now);

        request.Status.Should().Be(TopUpRequestStatus.Rejected);
        request.ProcessedByAdminId.Should().Be(adminId);
        request.ProcessedAt.Should().Be(now);
        request.RejectionReason.Should().Be("Invalid transaction code");
    }

    [Fact]
    public void Reject_WhenReasonEmpty_ThrowsArgumentException()
    {
        var request = CreatePendingRequest();
        var adminId = Guid.NewGuid();

        var act = () => request.Reject(adminId, "", DateTime.UtcNow);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Reject_WhenAlreadyRejected_ThrowsInvalidOperationException()
    {
        var request = CreatePendingRequest();
        var adminId = Guid.NewGuid();
        request.Reject(adminId, "Reason 1", DateTime.UtcNow);

        var act = () => request.Reject(adminId, "Reason 2", DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot reject top-up request in 'Rejected' status*");
    }
}
