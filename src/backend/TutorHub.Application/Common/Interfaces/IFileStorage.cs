namespace TutorHub.Application.Common.Interfaces;

public interface IFileStorage
{
    public const long MaxAttachmentSizeBytes = 10 * 1024 * 1024; // 10 MB

    public static readonly string[] AllowedMimeTypes = new[]
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf"
    };

    Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> GetAsync(string storageKey, CancellationToken cancellationToken = default);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}
