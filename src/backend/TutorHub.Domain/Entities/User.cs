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

    // No-show discipline (Q1b): rolling 30-day window of recorded absences.
    public int AbsentStrikes { get; set; }
    public DateTime? StrikeWindowStart { get; set; }
    public DateTime? LastAbsentAt { get; set; }

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

    /// <summary>
    /// Records a no-show absence (Q1b). Strikes accumulate in a rolling 30-day
    /// window; a strike older than the window resets the counter.
    /// </summary>
    public void RecordAbsentStrike(DateTime now)
    {
        if (!StrikeWindowStart.HasValue || (now - StrikeWindowStart.Value).TotalDays > 30)
        {
            AbsentStrikes = 1;
            StrikeWindowStart = now;
        }
        else
        {
            AbsentStrikes++;
        }

        LastAbsentAt = now;
    }

    /// <summary>
    /// Booking freeze (Q1b): 2+ strikes in the active window and the latest
    /// strike less than 7 days ago blocks new bookings.
    /// </summary>
    public bool IsBookingBlocked(DateTime now)
    {
        if (AbsentStrikes < 2)
        {
            return false;
        }

        if (!StrikeWindowStart.HasValue || (now - StrikeWindowStart.Value).TotalDays > 30)
        {
            return false;
        }

        return LastAbsentAt.HasValue && (now - LastAbsentAt.Value).TotalDays < 7;
    }
}