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
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId, cancellationToken);

        if (existing != null)
        {
            return await EvaluateExistingRecordAsync(existing, requestHash, now, ttl, endpoint, cancellationToken);
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
                return await EvaluateExistingRecordAsync(concurrentRecord, requestHash, now, ttl, endpoint, cancellationToken);
            }

            throw;
        }
    }

    private async Task<IdempotencyAcquireResult> EvaluateExistingRecordAsync(
        IdempotencyRecord record,
        string requestHash,
        DateTime now,
        TimeSpan ttl,
        string endpoint,
        CancellationToken cancellationToken)
    {
        // Expired and failed records are re-acquired with a database compare-and-swap.
        // Only one concurrent retry can change the row to Processing.
        if (record.HasExpired(now))
        {
            if (!IsPostgresProvider())
            {
                var tracked = await _context.IdempotencyRecords.FirstAsync(r => r.Id == record.Id, cancellationToken);
                tracked.Status = IdempotencyRecordStatus.Processing;
                tracked.RequestHash = requestHash;
                tracked.Endpoint = endpoint;
                tracked.ResponseStatusCode = null;
                tracked.ResponseContentType = null;
                tracked.ResponseBody = null;
                tracked.CreatedAt = now;
                tracked.ExpiresAt = now.Add(ttl);
                await _context.SaveChangesAsync(cancellationToken);
                return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);
            }

            var updated = await _context.IdempotencyRecords
                .Where(r => r.Id == record.Id && r.ExpiresAt <= now)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(r => r.Status, IdempotencyRecordStatus.Processing)
                    .SetProperty(r => r.RequestHash, requestHash)
                    .SetProperty(r => r.Endpoint, endpoint)
                    .SetProperty(r => r.ResponseStatusCode, (int?)null)
                    .SetProperty(r => r.ResponseContentType, (string?)null)
                    .SetProperty(r => r.ResponseBody, (string?)null)
                    .SetProperty(r => r.CreatedAt, now)
                    .SetProperty(r => r.ExpiresAt, now.Add(ttl)), cancellationToken);

            if (updated == 1)
                return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);

            return await ReloadAndEvaluateAsync(record.Id, requestHash, now, ttl, endpoint, cancellationToken);
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

        if (!IsPostgresProvider())
        {
            var tracked = await _context.IdempotencyRecords.FirstAsync(r => r.Id == record.Id, cancellationToken);
            tracked.Status = IdempotencyRecordStatus.Processing;
            tracked.CreatedAt = now;
            tracked.ExpiresAt = now.Add(ttl);
            await _context.SaveChangesAsync(cancellationToken);
            return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);
        }

        var reacquired = await _context.IdempotencyRecords
            .Where(r => r.Id == record.Id && r.Status == IdempotencyRecordStatus.Failed && r.ExpiresAt > now)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(r => r.Status, IdempotencyRecordStatus.Processing)
                .SetProperty(r => r.CreatedAt, now)
                .SetProperty(r => r.ExpiresAt, now.Add(ttl)), cancellationToken);

        if (reacquired == 1)
            return new IdempotencyAcquireResult(IdempotencyStatus.Acquired);

        return await ReloadAndEvaluateAsync(record.Id, requestHash, now, ttl, endpoint, cancellationToken);
    }

    private async Task<IdempotencyAcquireResult> ReloadAndEvaluateAsync(
        Guid id,
        string requestHash,
        DateTime now,
        TimeSpan ttl,
        string endpoint,
        CancellationToken cancellationToken)
    {
        var current = await _context.IdempotencyRecords.AsNoTracking()
            .FirstAsync(r => r.Id == id, cancellationToken);
        return await EvaluateExistingRecordAsync(current, requestHash, now, ttl, endpoint, cancellationToken);
    }

    private bool IsPostgresProvider() => string.Equals(
        _context.Database.ProviderName,
        "Npgsql.EntityFrameworkCore.PostgreSQL",
        StringComparison.Ordinal);

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
