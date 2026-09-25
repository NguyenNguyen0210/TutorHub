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

    // Brute-force lockout (P0-D3). Counted per ACCOUNT rather than per IP so a
    // distributed credential-stuffing attempt cannot sidestep the IP rate limiter.
    public int AccessFailedCount { get; set; }
    public DateTime? LockoutEndAt { get; set; }

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
    /// </summary>
    public void Ban()
    {
        if (Status == AccountStatus.Banned)
            throw new InvalidOperationException("Account is already banned.");
        Status = AccountStatus.Banned;
    }

    /// <summary>
    /// Transition: Banned → Active.
    /// Admin pardon/reinstatement after report resolution or successful appeal.
    /// </summary>
    public void Unban()
    {
        if (Status != AccountStatus.Banned)
            throw new InvalidOperationException(
                $"Cannot unban account with status '{Status}'. Only Banned accounts can be unbanned.");
        Status = AccountStatus.Active;
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

    /// <summary>
    /// True while the account is temporarily locked out after too many failed
    /// password checks (P0-D3). Once the window passes the account is usable again.
    /// </summary>
    public bool IsLockedOut(DateTime now) => LockoutEndAt.HasValue && LockoutEndAt.Value > now;

    /// <summary>
    /// Records one failed password check. On reaching
    /// <paramref name="maxFailedAttempts"/> consecutive failures the account is locked
    /// until <paramref name="now"/> + <paramref name="lockoutDuration"/> and the
    /// counter restarts, so the user gets a fresh allowance once the lockout expires.
    /// </summary>
    public void RegisterFailedLogin(DateTime now, int maxFailedAttempts, TimeSpan lockoutDuration)
    {
        if (maxFailedAttempts <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxFailedAttempts), "Threshold must be positive.");
        }

        if (lockoutDuration <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(lockoutDuration), "Lockout duration must be positive.");
        }

        AccessFailedCount++;

        if (AccessFailedCount >= maxFailedAttempts)
        {
            LockoutEndAt = now.Add(lockoutDuration);
            AccessFailedCount = 0;
        }
    }

    /// <summary>Clears the failed-attempt counter and any expired lockout (on success).</summary>
    public void ResetFailedLogin()
    {
        AccessFailedCount = 0;
        LockoutEndAt = null;
    }
}