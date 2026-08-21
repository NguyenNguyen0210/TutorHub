namespace TutorHub.Application.Common.Interfaces;

public interface IObjectStorageService
{
    Task<StoredFileResult> UploadAsync(
        Stream stream,
        string objectKey,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Stream> DownloadAsync(
        string objectKey,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(
        string objectKey,
        CancellationToken cancellationToken = default);

    Task<string> GenerateDownloadUrlAsync(
        string objectKey,
        TimeSpan expiration,
        CancellationToken cancellationToken = default);

    Task<string> GenerateUploadUrlAsync(
        string objectKey,
        string contentType,
        TimeSpan expiration,
        CancellationToken cancellationToken = default);
}
