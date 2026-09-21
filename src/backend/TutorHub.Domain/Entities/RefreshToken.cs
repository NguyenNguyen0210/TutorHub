namespace TutorHub.Domain.Entities;

public class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // P0-D1: only the HMAC-SHA256 hash of the opaque token is stored. The raw token
    // is returned to the client once and never persisted.
    public string TokenHash { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;
}
