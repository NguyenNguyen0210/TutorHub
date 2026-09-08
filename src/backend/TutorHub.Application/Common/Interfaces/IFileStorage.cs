using TutorHub.Application.Common.Files;

namespace TutorHub.Application.Common.Interfaces;

public interface IFileStorage
{
    public const long MaxAttachmentSizeBytes = UploadLimits.ChatAttachmentMaxBytes;

    public static readonly string[] AllowedMimeTypes = UploadLimits.ChatAttachmentMimeTypes;

    Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> GetAsync(string storageKey, CancellationToken cancellationToken = default);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}
