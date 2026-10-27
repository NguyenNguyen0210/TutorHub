namespace TutorHub.Domain.Entities;

public class ConversationAttachment
{
    public string StorageKey { get; set; } = string.Empty;
    public Guid ConversationId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; }
}
