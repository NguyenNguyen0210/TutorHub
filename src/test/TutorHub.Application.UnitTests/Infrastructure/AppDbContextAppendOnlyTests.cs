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
            Type = TransactionType.BookingPayment,
            Amount = 100_000m,
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Transactions.Add(tx);
        await context.SaveChangesAsync();

        // Act: Attempt to modify existing transaction
        tx.Status = TransactionStatus.Succeeded;

        // Assert: Throws InvalidOperationException per INV-LEDGER-007
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*append-only*");
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
            .WithMessage("*append-only*");
    }
}
