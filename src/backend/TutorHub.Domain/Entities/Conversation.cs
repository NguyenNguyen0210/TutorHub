namespace TutorHub.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; }

    // Canonical Participants (1 Student, 1 Tutor)
    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Summary of newest message (race-safe conditional update via UpdateLastMessage)
    public Guid? LastMessageId { get; private set; }
    public DateTime? LastMessageAt { get; private set; }
    public string? LastMessagePreview { get; private set; }

    // Navigation
    public ICollection<Message> Messages { get; set; } = new List<Message>();

    public void UpdateLastMessage(Guid messageId, string contentPreview, DateTime messageCreatedAt)
    {
        // Update only if this message is newer or tie-breaks with a greater ID
        if (!LastMessageAt.HasValue || messageCreatedAt > LastMessageAt.Value ||
            (messageCreatedAt == LastMessageAt.Value && messageId.CompareTo(LastMessageId ?? Guid.Empty) > 0))
        {
            LastMessageId = messageId;
            LastMessageAt = messageCreatedAt;
            LastMessagePreview = contentPreview.Length > 100 
                ? contentPreview[..100] 
                : contentPreview;
        }
    }
}
