namespace TutorHub.Application.Common.Files;

/// <summary>
/// Single source of truth for upload size/MIME rules.
/// Maxima are preserved from the pre-existing per-surface rules; only the
/// definitions are centralized so the matrix cannot drift again.
/// </summary>
public static class UploadLimits
{
    public const long BytesPerMb = 1024 * 1024;

    // Chat attachments (IFileStorage): 10 MB.
    public const long ChatAttachmentMaxBytes = 10 * BytesPerMb;

    public static readonly string[] ChatAttachmentMimeTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "text/plain"
    };

    // Dispute evidence: 10 MB (CLAUDE.md trap #4 whitelist).
    public const long EvidenceMaxBytes = 10 * BytesPerMb;

    public static readonly string[] EvidenceMimeTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "text/plain"
    };

    // Media library: 5 MB streamed upload, 20 MB presigned upload, 5 MB avatars.
    public const long MediaMaxBytes = 5 * BytesPerMb;
    public const long MediaPresignedMaxBytes = 20 * BytesPerMb;
    public const long MediaAvatarMaxBytes = 5 * BytesPerMb;

    public static readonly string[] MediaMimeTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    };

    public static readonly string[] PublicImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    public static readonly string[] PublicImageMimeTypes = { "image/jpeg", "image/png", "image/webp" };

    public static readonly string[] MediaExtensions =
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    };

    // Service demo video (MP4): 100 MB streamed upload. Demo clips are short,
    // so a hard cap keeps a single request bounded while still allowing
    // 2–3 minutes of 720p footage.
    public const long ServiceDemoVideoMaxBytes = 100 * BytesPerMb;

    public static readonly string[] ServiceDemoVideoExtensions = { ".mp4" };
    public static readonly string[] ServiceDemoVideoMimeTypes = { "video/mp4" };
}
