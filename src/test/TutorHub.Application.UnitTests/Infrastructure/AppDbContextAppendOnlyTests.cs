using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Infrastructure;

public class AppDbContextAppendOnlyTests
{
    [Fact]
    public async Task SaveChangesAsync_WhenModifyingTransaction_ThrowsInvalidOperationException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            Type = TransactionType.SessionPayoutCredit,
            Amount = 100_000m,
            Status = TransactionStatus.Released,
            CreatedAt = DateTime.UtcNow
        };

        context.Transactions.Add(tx);
        await context.SaveChangesAsync();

        // Act: Attempt to modify settled transaction to Refunded (DEC-S8-030)
        tx.Status = TransactionStatus.Refunded;

        // Assert: Throws InvalidOperationException per INV-LEDGER-007
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*immutable*");
    }

    [Fact]
    public async Task SaveChangesAsync_WhenDeletingTransaction_ThrowsInvalidOperationException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            Type = TransactionType.BookingPayment,
            Amount = 100_000m,
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Transactions.Add(tx);
        await context.SaveChangesAsync();

        // Act: Attempt to delete existing transaction
        context.Transactions.Remove(tx);

        // Assert: Throws InvalidOperationException per INV-LEDGER-007
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*cannot be deleted*");
    }

    [Fact]
    public async Task SaveChangesAsync_WhenModifyingAuditLog_ThrowsInvalidOperationException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "DisputeResolved",
            EntityName = "Dispute",
            EntityId = Guid.NewGuid().ToString(),
            CorrelationId = "corr-123",
            CreatedAt = DateTime.UtcNow
        };

        context.AuditLogs.Add(log);
        await context.SaveChangesAsync();

        // Act: Attempt to tamper with audit log
        log.Action = "TamperedAction";

        // Assert: Throws InvalidOperationException per INV-LEDGER-006
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*AuditLog records are append-only*");
    }

    [Fact]
    public async Task SaveChangesAsync_WhenDeletingAuditLog_ThrowsInvalidOperationException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "PlatformFeeUpdated",
            EntityName = "PlatformSetting",
            EntityId = "PlatformFeeRate",
            CorrelationId = "corr-456",
            CreatedAt = DateTime.UtcNow
        };

        context.AuditLogs.Add(log);
        await context.SaveChangesAsync();

        // Act: Attempt to delete audit log
        context.AuditLogs.Remove(log);

        // Assert: Throws InvalidOperationException per INV-LEDGER-006
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*AuditLog records are append-only*");
    }

    [Fact]
    public async Task SaveChangesAsync_WhenAdjustmentPointsToNonEarningTransaction_ThrowsInvalidOperationException()
    {
        // Arrange (DEC-S8-030 Anti-Chaining Test: Adjustment chained to another adjustment)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var firstAdjustment = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            Type = TransactionType.StudentRefund,
            Amount = 100_000m,
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Transactions.Add(firstAdjustment);
        await context.SaveChangesAsync();

        // Act: Attempt to chain a second adjustment to the first adjustment (not SessionPayoutCredit)
        var chainedAdjustment = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = firstAdjustment.BookingId,
            RelatedTransactionId = firstAdjustment.Id,
            RelatedTransaction = firstAdjustment,
            Type = TransactionType.PlatformFeeReversal,
            Amount = 0m,
            CommissionAmount = 10_000m,
            Status = TransactionStatus.Succeeded,
            CreatedAt = DateTime.UtcNow
        };
        context.Transactions.Add(chainedAdjustment);

        // Assert: Throws InvalidOperationException per INV-LEDGER-007
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*chaining is forbidden*");
    }

    /// <summary>Every public persistence entry point on DbContext.</summary>
    public enum SaveEntryPoint
    {
        SaveChanges,
        SaveChangesWithAcceptAllChanges,
        SaveChangesAsync,
        SaveChangesAsyncWithAcceptAllChanges
    }

    private static Task InvokeSave(AppDbContext context, SaveEntryPoint entryPoint) => entryPoint switch
    {
        SaveEntryPoint.SaveChanges => Task.FromResult(context.SaveChanges()),
        SaveEntryPoint.SaveChangesWithAcceptAllChanges =>
            Task.FromResult(context.SaveChanges(acceptAllChangesOnSuccess: true)),
        SaveEntryPoint.SaveChangesAsync => context.SaveChangesAsync(),
        SaveEntryPoint.SaveChangesAsyncWithAcceptAllChanges =>
            context.SaveChangesAsync(acceptAllChangesOnSuccess: true),
        _ => throw new ArgumentOutOfRangeException(nameof(entryPoint))
    };

    [Theory]
    [InlineData(SaveEntryPoint.SaveChanges)]
    [InlineData(SaveEntryPoint.SaveChangesWithAcceptAllChanges)]
    [InlineData(SaveEntryPoint.SaveChangesAsync)]
    [InlineData(SaveEntryPoint.SaveChangesAsyncWithAcceptAllChanges)]
    public async Task EverySaveEntryPoint_BlocksModifyingSettledTransaction(SaveEntryPoint entryPoint)
    {
        // P0-C1: guarding only the async overload left three doors open.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            Type = TransactionType.SessionPayoutCredit,
            Amount = 100_000m,
            Status = TransactionStatus.Released,
            CreatedAt = DateTime.UtcNow
        };
        context.Transactions.Add(tx);
        await context.SaveChangesAsync();

        tx.Status = TransactionStatus.Refunded;

        Func<Task> act = async () => await InvokeSave(context, entryPoint);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*immutable*");
    }

    [Theory]
    [InlineData(SaveEntryPoint.SaveChanges)]
    [InlineData(SaveEntryPoint.SaveChangesWithAcceptAllChanges)]
    [InlineData(SaveEntryPoint.SaveChangesAsync)]
    [InlineData(SaveEntryPoint.SaveChangesAsyncWithAcceptAllChanges)]
    public async Task EverySaveEntryPoint_BlocksDeletingAuditLog(SaveEntryPoint entryPoint)
    {
        // P0-C1 / INV-LEDGER-006 on every overload.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "PlatformFeeRateUpdated",
            EntityName = "PlatformSetting",
            EntityId = "PlatformFeeRate",
            CorrelationId = "corr-guard",
            CreatedAt = DateTime.UtcNow
        };
        context.AuditLogs.Add(log);
        await context.SaveChangesAsync();

        context.AuditLogs.Remove(log);

        Func<Task> act = async () => await InvokeSave(context, entryPoint);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*AuditLog records are append-only*");
    }
}
