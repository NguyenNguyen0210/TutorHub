namespace TutorHub.Domain.Entities;

/// <summary>
/// Tutor-written record of a delivered session (F-14, FR-LEARN-001..004).
/// Write-once: no edit path. Student read-only. No earning gate —
/// payout depends solely on the attendance/finance path.
/// </summary>
public class LearningRecord
{
    public Guid Id { get; set; }

    // --- Session Provenance (1:0..1, enforced unique by EF config) ---
    public Guid SessionId { get; set; }
    public Session Session { get; set; } = default!;

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    // --- Content (immutable after creation) ---
    public string Content { get; private set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    private LearningRecord()
    {
    }

    public static LearningRecord Create(Guid sessionId, Guid tutorProfileId, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Learning record content is required.", nameof(content));

        var trimmed = content.Trim();
        if (trimmed.Length > 2000)
            throw new ArgumentException("Learning record content cannot exceed 2000 characters.", nameof(content));

        return new LearningRecord
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            TutorProfileId = tutorProfileId,
            Content = trimmed,
            CreatedAt = DateTime.UtcNow
        };
    }
}
