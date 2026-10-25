using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Services.Idempotency;

public class DbIdempotencyStore : IIdempotencyStore
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ILogger<DbIdempotencyStore> _logger;

    public DbIdempotencyStore(
        IAppDbContext context,
        IClock clock,
        ILogger<DbIdempotencyStore> logger)
    {
        _context = context;
        _clock = clock;
        _logger = logger;
    }

    public async Task<IdempotencyAcquireResult> TryAcquireAsync(
        string key,
        Guid? userId,
        string endpoint,
        string requestHash,
        TimeSpan ttl,
        CancellationToken cancellationToken = default)
    {
        var now = _clock.UtcNow;

        var existing = await _context.IdempotencyRecords
            .FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId, cancellationToken);

        if (existing != null)
        {
            return EvaluateExistingRecord(existing, requestHash, now, ttl, endpoint);
        }

        // Try to insert a fresh record in 'Processing' status
        var newRecord = new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            Key = key,
            UserId = userId,
            Endpoint = endpoint,
            RequestHash = requestHash,
            Status = IdempotencyRecordStatus.Processing,
            CreatedAt = now,
            ExpiresAt = now.Add(ttl)
        };

        _context.IdempotencyRecords.Add(newRecord);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);
        }
        catch (DbUpdateException ex)
        {
            // Concurrent race condition: Another thread/request inserted the same (Key, UserId) concurrently
            _logger.LogInformation(ex, "Concurrent idempotency acquisition for Key={Key}, UserId={UserId}", key, userId);

            // Detach failed entity from change tracker so context remains usable
            _context.IdempotencyRecords.Entry(newRecord).State = EntityState.Detached;

            var concurrentRecord = await _context.IdempotencyRecords
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId, cancellationToken);

            if (concurrentRecord != null)
            {
                return EvaluateExistingRecord(concurrentRecord, requestHash, now, ttl, endpoint);
            }

            throw;
        }
    }

    private IdempotencyAcquireResult EvaluateExistingRecord(
        IdempotencyRecord record,
        string requestHash,
        DateTime now,
        TimeSpan ttl,
        string endpoint)
    {
        // 1. Check if record has expired -> allow re-acquiring
        if (record.HasExpired(now))
        {
            record.Status = IdempotencyRecordStatus.Processing;
            record.RequestHash = requestHash;
            record.Endpoint = endpoint;
            record.ResponseStatusCode = null;
            record.ResponseContentType = null;
            record.ResponseBody = null;
            record.CreatedAt = now;
            record.ExpiresAt = now.Add(ttl);
            return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);
        }

        // 2. Check if request payload hash matches
        if (!string.Equals(record.RequestHash, requestHash, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Idempotency key payload mismatch for Key={Key}, UserId={UserId}", record.Key, record.UserId);
            return new IdempotencyAcquireResult(
                IdempotencyStatus.PayloadMismatch,
                ErrorMessage: "Idempotency-Key has already been used with a different request payload.");
        }

        // 3. Check status
        if (record.Status == IdempotencyRecordStatus.Completed)
        {
            return new IdempotencyAcquireResult(
                IdempotencyStatus.CachedAvailable,
                record.ResponseStatusCode,
                record.ResponseContentType,
                record.ResponseBody);
        }

        if (record.Status == IdempotencyRecordStatus.Processing)
        {
            return new IdempotencyAcquireResult(
                IdempotencyStatus.InFlight,
                ErrorMessage: "A request with the same Idempotency-Key is currently in progress. Please retry after it completes.");
        }

        // 4. If previous attempt failed, allow client to retry with new processing lock
        record.Status = IdempotencyRecordStatus.Processing;
        record.CreatedAt = now;
        record.ExpiresAt = now.Add(ttl);
        return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);
    }

    public async Task SaveCompletedAsync(
        string key,
        Guid? userId,
        int statusCode,
        string contentType,
        string responseBody,
        CancellationToken cancellationToken = default)
    {
        var record = await _context.IdempotencyRecords
            .FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId, cancellationToken);

        if (record != null)
        {
            record.MarkCompleted(statusCode, contentType, responseBody);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task ReleaseFailedAsync(
        string key,
        Guid? userId,
        CancellationToken cancellationToken = default)
    {
        var record = await _context.IdempotencyRecords
            .FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId, cancellationToken);

        if (record != null)
        {
            record.MarkFailed();
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
