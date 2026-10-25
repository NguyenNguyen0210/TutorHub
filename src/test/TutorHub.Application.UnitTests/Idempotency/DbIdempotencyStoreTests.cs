using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using TutorHub.Infrastructure.Services.Idempotency;
using Xunit;

namespace TutorHub.Application.UnitTests.Idempotency;

public class DbIdempotencyStoreTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task TryAcquireAsync_WhenKeyIsFresh_ReturnsAcquiredAndPersistsProcessingStatus()
    {
        // Arrange
        using var context = CreateContext();
        var now = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);
        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);
        var key = "KEY-001";
        var userId = Guid.NewGuid();
        var endpoint = "/api/v1/bookings";
        var hash = "abc123hash";
        var ttl = TimeSpan.FromHours(24);

        // Act
        var result = await store.TryAcquireAsync(key, userId, endpoint, hash, ttl);

        // Assert
        result.Status.Should().Be(IdempotencyStatus.Acquired);

        var record = await context.IdempotencyRecords.FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId);
        record.Should().NotBeNull();
        record!.Status.Should().Be(IdempotencyRecordStatus.Processing);
        record.RequestHash.Should().Be(hash);
        record.CreatedAt.Should().Be(now);
        record.ExpiresAt.Should().Be(now.Add(ttl));
    }

    [Fact]
    public async Task TryAcquireAsync_WhenKeyIsInFlightWithSamePayload_ReturnsInFlight()
    {
        // Arrange
        using var context = CreateContext();
        var now = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);
        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var key = "KEY-INFLIGHT";
        var userId = Guid.NewGuid();
        var hash = "hash-123";

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = "/api/v1/payments/initiate",
            RequestHash = hash,
            Status = IdempotencyRecordStatus.Processing,
            CreatedAt = now,
            ExpiresAt = now.AddHours(24)
        });
        await context.SaveChangesAsync();

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);

        // Act
        var result = await store.TryAcquireAsync(key, userId, "/api/v1/payments/initiate", hash, TimeSpan.FromHours(24));

        // Assert
        result.Status.Should().Be(IdempotencyStatus.InFlight);
        result.ErrorMessage.Should().Contain("currently in progress");
    }

    [Fact]
    public async Task TryAcquireAsync_WhenKeyIsCompletedWithSamePayload_ReturnsCachedAvailableWithBody()
    {
        // Arrange
        using var context = CreateContext();
        var now = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);
        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var key = "KEY-COMPLETED";
        var userId = Guid.NewGuid();
        var hash = "hash-123";
        var cachedBody = "{\"success\":true,\"bookingId\":\"123\"}";

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = "/api/v1/bookings",
            RequestHash = hash,
            Status = IdempotencyRecordStatus.Completed,
            ResponseStatusCode = 201,
            ResponseContentType = "application/json",
            ResponseBody = cachedBody,
            CreatedAt = now,
            ExpiresAt = now.AddHours(24)
        });
        await context.SaveChangesAsync();

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);

        // Act
        var result = await store.TryAcquireAsync(key, userId, "/api/v1/bookings", hash, TimeSpan.FromHours(24));

        // Assert
        result.Status.Should().Be(IdempotencyStatus.CachedAvailable);
        result.CachedStatusCode.Should().Be(201);
        result.CachedContentType.Should().Be("application/json");
        result.CachedResponseBody.Should().Be(cachedBody);
    }

    [Fact]
    public async Task TryAcquireAsync_WhenPayloadHashDiffers_ReturnsPayloadMismatch()
    {
        // Arrange
        using var context = CreateContext();
        var now = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);
        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var key = "KEY-MISMATCH";
        var userId = Guid.NewGuid();

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = "/api/v1/students/me/wallet/withdrawals",
            RequestHash = "original-hash-100k",
            Status = IdempotencyRecordStatus.Completed,
            ResponseStatusCode = 200,
            ResponseBody = "{}",
            CreatedAt = now,
            ExpiresAt = now.AddHours(24)
        });
        await context.SaveChangesAsync();

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);

        // Act
        var result = await store.TryAcquireAsync(key, userId, "/api/v1/students/me/wallet/withdrawals", "tampered-hash-500k", TimeSpan.FromHours(24));

        // Assert
        result.Status.Should().Be(IdempotencyStatus.PayloadMismatch);
        result.ErrorMessage.Should().Contain("different request payload");
    }

    [Fact]
    public async Task TryAcquireAsync_WhenKeyHasExpired_ReAcquiresWithFreshTtl()
    {
        // Arrange
        using var context = CreateContext();
        var past = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc);

        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var key = "KEY-EXPIRED";
        var userId = Guid.NewGuid();

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = "/api/v1/bookings",
            RequestHash = "some-hash",
            Status = IdempotencyRecordStatus.Completed,
            ResponseStatusCode = 200,
            ResponseBody = "{}",
            CreatedAt = past,
            ExpiresAt = past.AddHours(24) // Expired 4 days ago
        });
        await context.SaveChangesAsync();

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);

        // Act
        var result = await store.TryAcquireAsync(key, userId, "/api/v1/bookings", "new-hash", TimeSpan.FromHours(24));

        // Assert
        result.Status.Should().Be(IdempotencyStatus.Acquired);
        var record = await context.IdempotencyRecords.FirstAsync(r => r.Key == key && r.UserId == userId);
        record.Status.Should().Be(IdempotencyRecordStatus.Processing);
        record.RequestHash.Should().Be("new-hash");
        record.ExpiresAt.Should().Be(now.AddHours(24));
    }

    [Fact]
    public async Task SaveCompletedAsync_UpdatesStatusAndSavesResponse()
    {
        // Arrange
        using var context = CreateContext();
        var now = DateTime.UtcNow;
        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var key = "KEY-TO-COMPLETE";
        var userId = Guid.NewGuid();

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = "/api/v1/payments/initiate",
            RequestHash = "hash",
            Status = IdempotencyRecordStatus.Processing,
            CreatedAt = now,
            ExpiresAt = now.AddHours(24)
        });
        await context.SaveChangesAsync();

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);

        // Act
        await store.SaveCompletedAsync(key, userId, 200, "application/json", "{\"paymentUrl\":\"https://vnpay\"}");

        // Assert
        var record = await context.IdempotencyRecords.FirstAsync(r => r.Key == key && r.UserId == userId);
        record.Status.Should().Be(IdempotencyRecordStatus.Completed);
        record.ResponseStatusCode.Should().Be(200);
        record.ResponseContentType.Should().Be("application/json");
        record.ResponseBody.Should().Be("{\"paymentUrl\":\"https://vnpay\"}");
    }

    [Fact]
    public async Task ReleaseFailedAsync_SetsStatusToFailedToPermitRetry()
    {
        // Arrange
        using var context = CreateContext();
        var now = DateTime.UtcNow;
        var clockMock = new Mock<IClock>();
        clockMock.Setup(c => c.UtcNow).Returns(now);

        var key = "KEY-TO-FAIL";
        var userId = Guid.NewGuid();

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = "/api/v1/bookings",
            RequestHash = "hash",
            Status = IdempotencyRecordStatus.Processing,
            CreatedAt = now,
            ExpiresAt = now.AddHours(24)
        });
        await context.SaveChangesAsync();

        var store = new DbIdempotencyStore(context, clockMock.Object, NullLogger<DbIdempotencyStore>.Instance);

        // Act
        await store.ReleaseFailedAsync(key, userId);

        // Assert
        var record = await context.IdempotencyRecords.FirstAsync(r => r.Key == key && r.UserId == userId);
        record.Status.Should().Be(IdempotencyRecordStatus.Failed);

        // Re-acquiring a failed key should succeed
        var retryResult = await store.TryAcquireAsync(key, userId, "/api/v1/bookings", "hash", TimeSpan.FromHours(24));
        retryResult.Status.Should().Be(IdempotencyStatus.Acquired);
    }
}
