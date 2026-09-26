using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

/// <summary>
/// A third-party identity linked to a <see cref="User"/>.
///
/// Kept as its own table rather than columns on <c>User</c> because one account may
/// sign in through several providers, and because <c>ProviderUserId</c> — not the
/// email — is the durable identity. Both Google and Facebook let a user change
/// their email, so the provider's own subject id is the only key that does not rot.
/// </summary>
public class ExternalLogin
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public ExternalAuthProvider Provider { get; set; }

    /// <summary>
    /// The provider's stable user identifier: Google's <c>sub</c>, Facebook's <c>id</c>.
    /// Unique together with <see cref="Provider"/>.
    /// </summary>
    public string ProviderUserId { get; set; } = default!;

    /// <summary>
    /// Email as the provider reported it at link time. Kept for auditing; never used
    /// to find the account, because a user can change their email at the provider.
    /// </summary>
    public string? EmailAtLinkTime { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime LastLoginAt { get; set; }
}
