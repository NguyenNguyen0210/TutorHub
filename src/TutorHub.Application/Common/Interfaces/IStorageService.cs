namespace TutorHub.Application.Common.Interfaces;

public record StoredFileResult(
    string ObjectKey,
    long Size,
    string ContentType,
    string? ETag
);

public interface IStorageService
{
    Task<StoredFileResult> UploadAsync(
        Stream stream,
        string objectKey,
        string contentType,
        bool isPrivate,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default);

    Task<string> GetReadUrlAsync(
        string objectKey,
        TimeSpan expiresIn,
        CancellationToken cancellationToken = default);

    string GetPublicUrl(string objectKey);
}
