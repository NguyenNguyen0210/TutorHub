using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class IdempotencyRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Client-supplied idempotency key (UUIDv4 or opaque ASCII token up to 128 chars).
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Authenticated user identifier (if request was authenticated).
    /// Scopes the key to the user to prevent cross-account key collisions.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// HTTP path of the target endpoint (e.g. /api/v1/bookings).
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// SHA-256 fingerprint hex of Method + Path + UserId + RequestBody.
    /// </summary>
    public string RequestHash { get; set; } = string.Empty;

    /// <summary>
    /// Current execution status of the request.
    /// </summary>
    public IdempotencyRecordStatus Status { get; set; } = IdempotencyRecordStatus.Processing;

    /// <summary>
    /// Cached HTTP response status code upon completion.
    /// </summary>
    public int? ResponseStatusCode { get; set; }

    /// <summary>
    /// Cached response Content-Type (e.g. application/json; charset=utf-8).
    /// </summary>
    public string? ResponseContentType { get; set; }

    /// <summary>
    /// Cached serialized response payload.
    /// </summary>
    public string? ResponseBody { get; set; }

    /// <summary>
    /// Time when the key was acquired.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Time when the cached record expires and may be purged by cleanup jobs.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    public bool HasExpired(DateTime now) => ExpiresAt <= now;

    public void MarkCompleted(int statusCode, string contentType, string responseBody)
    {
        Status = IdempotencyRecordStatus.Completed;
        ResponseStatusCode = statusCode;
        ResponseContentType = contentType;
        ResponseBody = responseBody;
    }

    public void MarkFailed()
    {
        Status = IdempotencyRecordStatus.Failed;
    }
}
