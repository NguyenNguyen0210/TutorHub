namespace TutorHub.Application.Common.Interfaces;

public enum IdempotencyStatus
{
    Acquired,          // Lock acquired, execution allowed to continue
    InFlight,          // Previous concurrent request is still running -> 409 Conflict
    CachedAvailable,   // Previous request completed successfully -> 200 Replay
    PayloadMismatch    // Key reused with different payload/hash -> 422 Unprocessable
}

public record IdempotencyAcquireResult(
    IdempotencyStatus Status,
    int? CachedStatusCode = null,
    string? CachedContentType = null,
    string? CachedResponseBody = null,
    string? ErrorMessage = null);

public interface IIdempotencyStore
{
    /// <summary>
    /// Attempts to acquire an execution lock for the given idempotency key.
    /// Returns Acquired if this is a fresh key, InFlight if already running,
    /// CachedAvailable if already completed, or PayloadMismatch if body hash differed.
    /// </summary>
    Task<IdempotencyAcquireResult> TryAcquireAsync(
        string key,
        Guid? userId,
        string endpoint,
        string requestHash,
        TimeSpan ttl,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks the record as Completed and stores the response status, content type, and body.
    /// </summary>
    Task SaveCompletedAsync(
        string key,
        Guid? userId,
        int statusCode,
        string contentType,
        string responseBody,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Releases or marks the record as Failed in case of downstream exception, permitting safe client retry.
    /// </summary>
    Task ReleaseFailedAsync(
        string key,
        Guid? userId,
        CancellationToken cancellationToken = default);
}
