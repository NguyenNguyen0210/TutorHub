namespace TutorHub.Domain.Entities;

public class Review
{
    public Guid Id { get; set; }

    // --- Single Source of Truth Provenance (Enrollment-centric) ---
    public Guid EnrollmentId { get; set; }
    public Enrollment Enrollment { get; set; } = default!;

    // --- Content ---
    public int Rating { get; set; }

    public string? Comment { get; set; }

    // --- Tutor Feedback ---
    public string? TutorReply { get; private set; }
    public DateTime? TutorRepliedAt { get; private set; }

    // --- Moderation & Visibility ---
    public bool IsRemoved { get; private set; } = false;
    public string? RemovalReason { get; private set; }
    public DateTime? RemovedAt { get; private set; }
    public Guid? RemovedByAdminId { get; private set; }
    public User? RemovedByAdmin { get; private set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // --- Domain State Machine Methods ---
    public void SetTutorReply(string replyText)
    {
        if (string.IsNullOrWhiteSpace(replyText))
            throw new ArgumentException("Reply text cannot be empty.", nameof(replyText));

        if (IsRemoved)
            throw new InvalidOperationException("Cannot reply to a removed review.");

        TutorReply = replyText.Trim();
        TutorRepliedAt = DateTime.UtcNow;
    }

    public void RemoveByAdmin(string reason, Guid adminId)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Removal reason is required.", nameof(reason));

        if (IsRemoved)
            throw new InvalidOperationException("Review is already removed.");

        IsRemoved = true;
        RemovalReason = reason.Trim();
        RemovedAt = DateTime.UtcNow;
        RemovedByAdminId = adminId;
    }
}
