namespace TutorHub.Domain.Entities;

public class Message
{
    public Guid Id { get; set; }

    // Parent conversation
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = default!;

    // Sender
    public Guid SenderUserId { get; set; }
    public User SenderUser { get; set; } = default!;

    // Content
    public string Content { get; set; } = string.Empty;

    // Optional Attachment (DEC-S7-019)
    public string? AttachmentKey { get; set; }
    public string? AttachmentName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentSize { get; set; }

    // Read status
    public bool IsRead { get; private set; } = false;
    public DateTime? ReadAt { get; private set; }

    // Timestamps
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
