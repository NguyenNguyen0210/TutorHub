using TutorHub.Domain.Enums;
namespace TutorHub.Domain.Entities;

public class User
{
    public Guid Id { get; set; }

    // Authentication
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;

    // Common profile
    public string FullName { get; set; } = default!;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }

    // Authorization
    public UserRole Role { get; set; }

    // Account status
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    public DateTime CreatedAt { get; set; }

    // Profiles
    public TutorProfile? TutorProfile { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public ICollection<TutorApplication> TutorApplications { get; set; } = new List<TutorApplication>();

    // Media
    public ICollection<Media> MediaUploaded { get; set; } = new List<Media>();

    // ── State transition methods ──────────────────────────────────────
    // These enforce transition validity only.
    // Admin invariants (self-lockout, last-admin, token revocation, audit)
    // belong in Application layer handlers.

    /// <summary>
    /// Transition: Active → Suspended.
    /// </summary>
    public void Suspend()
    {
        if (Status != AccountStatus.Active)
            throw new InvalidOperationException(
                $"Cannot suspend account with status '{Status}'. Only Active accounts can be suspended.");
        Status = AccountStatus.Suspended;
    }

    /// <summary>
    /// Transition: Suspended → Active.
    /// </summary>
    public void Reactivate()
    {
        if (Status != AccountStatus.Suspended)
            throw new InvalidOperationException(
                $"Cannot reactivate account with status '{Status}'. Only Suspended accounts can be reactivated.");
        Status = AccountStatus.Active;
    }

    /// <summary>
    /// Transition: Active|Suspended → Banned.
    /// Note: Banned→? is currently unspecified by PRD. No Unban() method exists until PRD resolves this.
    /// </summary>
    public void Ban()
    {
        if (Status == AccountStatus.Banned)
            throw new InvalidOperationException("Account is already banned.");
        Status = AccountStatus.Banned;
    }
}