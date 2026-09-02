namespace TutorHub.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? DeepLink { get; set; }

    public bool IsRead { get; private set; } = false;
    public DateTime? ReadAt { get; private set; }

    // Critical notifications (Payment, Refund, Withdrawal, Dispute, Security) cannot be disabled from preferences
    public bool IsCritical { get; set; } = false;

    public Guid? EventId { get; set; }
    public string DeduplicationKey { get; set; } = string.Empty; // Non-null: event:{EventId} or reminder:{Id}:{Time}

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public void MarkAsRead(DateTime readAt)
    {
        if (!IsRead)
        {
            IsRead = true;
            ReadAt = readAt;
        }
    }
}
