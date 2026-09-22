using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class StudentWithdrawalTests
{
    private static StudentWithdrawal CreatePendingWithdrawal(decimal amount = 100_000m) => new()
    {
        Id = Guid.NewGuid(),
        StudentWalletId = Guid.NewGuid(),
        Amount = amount,
        Status = WithdrawalStatus.Pending,
        BankName = "Vietcombank",
        AccountNumber = "1234567890",
        AccountHolderName = "NGUYEN VAN A",
        RequestedAt = DateTime.UtcNow
    };

    [Fact]
    public void MarkProcessing_FromPending_Succeeds()
    {
        var withdrawal = CreatePendingWithdrawal();
        var adminId = Guid.NewGuid();

        withdrawal.MarkProcessing(adminId);

        withdrawal.Status.Should().Be(WithdrawalStatus.Processing);
        withdrawal.ProcessingStartedByAdminId.Should().Be(adminId);
        withdrawal.ProcessingStartedAt.Should().NotBeNull();
    }

    [Fact]
    public void Complete_FromProcessing_Succeeds()
    {
        var withdrawal = CreatePendingWithdrawal();
        var adminId = Guid.NewGuid();
        withdrawal.MarkProcessing(adminId);

        withdrawal.Complete(adminId);

        withdrawal.Status.Should().Be(WithdrawalStatus.Completed);
        withdrawal.ProcessedByAdminId.Should().Be(adminId);
        withdrawal.ProcessedAt.Should().NotBeNull();
    }

    [Fact]
    public void Complete_DirectlyFromPending_ThrowsInvalidOperationException()
    {
        var withdrawal = CreatePendingWithdrawal();
        var adminId = Guid.NewGuid();

        var act = () => withdrawal.Complete(adminId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Must be in Processing status*");
    }

    [Fact]
    public void Fail_FromProcessing_Succeeds()
    {
        var withdrawal = CreatePendingWithdrawal();
        var adminId = Guid.NewGuid();
        withdrawal.MarkProcessing(adminId);

        withdrawal.Fail("Invalid beneficiary account", adminId);

        withdrawal.Status.Should().Be(WithdrawalStatus.Failed);
        withdrawal.FailureReason.Should().Be("Invalid beneficiary account");
        withdrawal.ProcessedByAdminId.Should().Be(adminId);
        withdrawal.ProcessedAt.Should().NotBeNull();
    }
}
