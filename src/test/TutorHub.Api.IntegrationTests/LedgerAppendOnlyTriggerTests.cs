using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-C2 / P0-F2: the financial ledger is defended at the DATABASE level, not only in
/// the EF change tracker. These tests issue raw SQL precisely because the second layer
/// exists for the writes EF never sees: hand-written SQL, manual fixes, and ON DELETE
/// CASCADE.
///
/// The permitted transition is asserted too — a StudentRefund must still be able to go
/// Pending -> Succeeded, otherwise external settlement could never be recorded.
/// </summary>
public class LedgerAppendOnlyTriggerTests : IntegrationTestBase
{
    public LedgerAppendOnlyTriggerTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task DeletingASettledTransaction_IsRejectedByPostgres()
    {
        var (payout, _) = await SeedLedgerRowsAsync();

        var act = () => Db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM \"Transactions\" WHERE \"Id\" = {payout.Id}");

        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.MessageText.Should().Contain("cannot be deleted");
    }

    [Fact]
    public async Task UpdatingASettledTransaction_IsRejectedByPostgres()
    {
        var (payout, _) = await SeedLedgerRowsAsync();

        var act = () => Db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Transactions\" SET \"Amount\" = {1m} WHERE \"Id\" = {payout.Id}");

        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.MessageText.Should().Contain("immutable");
    }

    [Fact]
    public async Task SettlingAPendingRefund_IsAllowedUntilItBecomesImmutable()
    {
        // Arrange
        var (_, refund) = await SeedLedgerRowsAsync();

        // Act: the gateway confirms the refund — Pending -> Succeeded must be permitted.
        await Db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Transactions\" SET \"Status\" = {"Succeeded"} WHERE \"Id\" = {refund.Id}");

        // Assert
        var settled = await Db.Transactions.AsNoTracking().FirstAsync(t => t.Id == refund.Id);
        settled.Status.Should().Be(TransactionStatus.Succeeded);

        // Once settled, the record is history and joins the immutable set.
        var act = () => Db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Transactions\" SET \"Amount\" = {1m} WHERE \"Id\" = {refund.Id}");

        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.MessageText.Should().Contain("immutable");
    }

    [Fact]
    public async Task UpdatingAnAuditLog_IsRejectedByPostgres()
    {
        var auditLog = await SeedAuditLogAsync();

        var act = () => Db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"AuditLogs\" SET \"Action\" = {"Tampered"} WHERE \"Id\" = {auditLog.Id}");

        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.MessageText.Should().Contain("append-only");
    }

    [Fact]
    public async Task DeletingAnAuditLog_IsRejectedByPostgres()
    {
        var auditLog = await SeedAuditLogAsync();

        var act = () => Db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM \"AuditLogs\" WHERE \"Id\" = {auditLog.Id}");

        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.MessageText.Should().Contain("append-only");
    }

    private async Task<(Transaction Payout, Transaction Refund)> SeedLedgerRowsAsync()
    {
        var bookingId = await SeedBookingIdAsync();
        var now = DateTime.UtcNow;

        var payout = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Amount = 300_000m,
            Type = TransactionType.SessionPayoutCredit,
            Status = TransactionStatus.Released,
            CommissionRate = 0.10m,
            CommissionAmount = 30_000m,
            PayoutAmount = 270_000m,
            PaymentGatewayRef = $"TriggerProbe-{Guid.NewGuid():N}",
            CreatedAt = now,
            ReleasedAt = now
        };

        var refund = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Amount = 50_000m,
            Type = TransactionType.StudentRefund,
            Status = TransactionStatus.Pending,
            CommissionRate = 0m,
            CommissionAmount = 0m,
            PayoutAmount = 0m,
            RelatedTransactionId = payout.Id,
            PaymentGatewayRef = $"TriggerProbeRefund-{Guid.NewGuid():N}",
            CreatedAt = now
        };

        Db.Transactions.AddRange(payout, refund);
        await Db.SaveChangesAsync();

        return (payout, refund);
    }

    private async Task<AuditLog> SeedAuditLogAsync()
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "TriggerProbe",
            EntityName = "Transaction",
            EntityId = Guid.NewGuid().ToString(),
            CorrelationId = "trigger-probe",
            CreatedAt = DateTime.UtcNow
        };

        Db.AuditLogs.Add(auditLog);
        await Db.SaveChangesAsync();

        return auditLog;
    }

    private async Task<Guid> SeedBookingIdAsync()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));

        return booking.Id;
    }
}
