namespace TutorHub.Domain.Entities;

public class DisputeEvidence
{
    public Guid Id { get; set; }

    public Guid DisputeId { get; set; }
    public Dispute Dispute { get; set; } = default!;

    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = default!;

    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
