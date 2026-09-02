using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class EmailDelivery
{
    public Guid Id { get; set; }

    public Guid NotificationId { get; set; }
    public Notification Notification { get; set; } = default!;

    public Guid UserId { get; set; }
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    public EmailDeliveryStatus Status { get; set; } = EmailDeliveryStatus.Pending;
    public int RetryCount { get; set; } = 0;
    public DateTime? NextAttemptAt { get; set; }
    public DateTime? SentAt { get; set; }
    public string? LastError { get; set; }
    public string? ProviderMessageId { get; set; }

    public DateTime? LockedUntil { get; set; }
    public string? LockedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
