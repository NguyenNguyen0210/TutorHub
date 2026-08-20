using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Media
{
    public Guid Id { get; set; }
    public string ObjectKey { get; set; } = default!;
    public string OriginalFileName { get; set; } = default!;
    public string StoredFileName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public long FileSize { get; set; }
    public string StorageProvider { get; set; } = "AwsS3";
    public string BucketName { get; set; } = default!;
    public MediaType MediaType { get; set; }
    public bool IsPrivate { get; set; }
    public MediaStatus Status { get; set; } = MediaStatus.Active;

    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = default!;

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
