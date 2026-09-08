namespace TutorHub.Application.Features.Notifications.DTOs;

public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? DeepLink { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsCritical { get; set; }
    public Guid? EventId { get; set; }
    public string DeduplicationKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
