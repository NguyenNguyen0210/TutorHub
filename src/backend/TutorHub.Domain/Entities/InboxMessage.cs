namespace TutorHub.Domain.Entities;

public class InboxMessage
{
    public Guid Id { get; set; }
    public string ConsumerName { get; set; } = string.Empty;
    public Guid EventId { get; set; }
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
