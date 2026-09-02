using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class WithdrawalTests
{
    [Fact]
    public void MarkProcessing_FromPending_TransitionsToProcessingAndSetsAudit()
    {
        // Arrange
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            Status = WithdrawalStatus.Pending
        };
        var adminId = Guid.NewGuid();

        // Act
        withdrawal.MarkProcessing(adminId);

        // Assert
        withdrawal.Status.Should().Be(WithdrawalStatus.Processing);
        withdrawal.ProcessingStartedByAdminId.Should().Be(adminId);
        withdrawal.ProcessingStartedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData(WithdrawalStatus.Processing)]
    [InlineData(WithdrawalStatus.Completed)]
    [InlineData(WithdrawalStatus.Failed)]
    public void MarkProcessing_FromNonPending_ThrowsInvalidOperationException(WithdrawalStatus status)
    {
        // Arrange
        var withdrawal = new Withdrawal { Id = Guid.NewGuid(), Status = status };

        // Act
        var act = () => withdrawal.MarkProcessing(Guid.NewGuid());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Must be in Pending status*");
    }

    [Fact]
    public void Complete_FromProcessing_TransitionsToCompletedAndSetsAudit()
    {
        // Arrange
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            Status = WithdrawalStatus.Processing
        };
        var adminId = Guid.NewGuid();

        // Act
        withdrawal.Complete(adminId);

        // Assert
        withdrawal.Status.Should().Be(WithdrawalStatus.Completed);
        withdrawal.ProcessedByAdminId.Should().Be(adminId);
        withdrawal.ProcessedAt.Should().NotBeNull();
    }

    [Fact]
    public void Complete_FromPending_ThrowsInvalidOperationException()
    {
        // Arrange (Strict State Machine Guard - DEC-WD-003, INV-WD-004)
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            Status = WithdrawalStatus.Pending
        };

        // Act
        var act = () => withdrawal.Complete(Guid.NewGuid());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Must be in Processing status*");
    }

    [Theory]
    [InlineData(WithdrawalStatus.Completed)]
    [InlineData(WithdrawalStatus.Failed)]
    public void Complete_FromTerminalStatus_ThrowsInvalidOperationException(WithdrawalStatus status)
    {
        // Arrange (Idempotency Guard - DEC-WD-008)
        var withdrawal = new Withdrawal { Id = Guid.NewGuid(), Status = status };

        // Act
        var act = () => withdrawal.Complete(Guid.NewGuid());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Must be in Processing status*");
    }

    [Fact]
    public void Fail_FromProcessing_TransitionsToFailedAndRecordsReason()
    {
        // Arrange
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            Status = WithdrawalStatus.Processing
        };
        var adminId = Guid.NewGuid();
        var reason = "Invalid bank account number";

        // Act
        withdrawal.Fail(reason, adminId);

        // Assert
        withdrawal.Status.Should().Be(WithdrawalStatus.Failed);
        withdrawal.FailureReason.Should().Be(reason);
        withdrawal.ProcessedByAdminId.Should().Be(adminId);
        withdrawal.ProcessedAt.Should().NotBeNull();
    }

    [Fact]
    public void Fail_FromPending_ThrowsInvalidOperationException()
    {
        // Arrange (Strict State Machine Guard - DEC-WD-003, INV-WD-004)
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            Status = WithdrawalStatus.Pending
        };

        // Act
        var act = () => withdrawal.Fail("Reason", Guid.NewGuid());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Must be in Processing status*");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Fail_WithoutReason_ThrowsArgumentException(string? invalidReason)
    {
        // Arrange
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            Status = WithdrawalStatus.Processing
        };

        // Act
        var act = () => withdrawal.Fail(invalidReason!, Guid.NewGuid());

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Failure reason is mandatory*");
    }

    [Theory]
    [InlineData(WithdrawalStatus.Completed)]
    [InlineData(WithdrawalStatus.Failed)]
    public void Fail_FromTerminalStatus_ThrowsInvalidOperationException(WithdrawalStatus status)
    {
        // Arrange (Idempotency Guard - DEC-WD-008)
        var withdrawal = new Withdrawal { Id = Guid.NewGuid(), Status = status };

        // Act
        var act = () => withdrawal.Fail("Some reason", Guid.NewGuid());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Must be in Processing status*");
    }
}
