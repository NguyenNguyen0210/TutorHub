using System.Collections.Concurrent;
using TutorHub.Application.Common.Storage;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

internal sealed class TestObjectStorageService : IObjectStorageService
{
    private readonly ConcurrentDictionary<string, (byte[] Content, string ContentType)> _objects = new();

    public StorageProvider Provider => StorageProvider.LocalFileSystem;

    public async Task<StoredFileResult> UploadAsync(
        Stream stream, string objectKey, string contentType, CancellationToken cancellationToken = default)
    {
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, cancellationToken);
        var content = buffer.ToArray();
        _objects[objectKey] = (content, contentType);
        return new StoredFileResult(objectKey, content.LongLength, contentType, null);
    }

    public Task<Stream> DownloadAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        if (!_objects.TryGetValue(objectKey, out var value))
            throw new FileNotFoundException("Test object not found.", objectKey);
        return Task.FromResult<Stream>(new MemoryStream(value.Content, writable: false));
    }

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        _objects.TryRemove(objectKey, out _);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken = default)
        => Task.FromResult(_objects.ContainsKey(objectKey));

    public Task<StoredFileResult?> GetMetadataAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        if (!_objects.TryGetValue(objectKey, out var value))
            return Task.FromResult<StoredFileResult?>(null);
        return Task.FromResult<StoredFileResult?>(
            new StoredFileResult(objectKey, value.Content.LongLength, value.ContentType, null));
    }

    public Task<string> GenerateDownloadUrlAsync(
        string objectKey, TimeSpan expiration, CancellationToken cancellationToken = default)
        => Task.FromResult($"https://storage.test/{objectKey}");

    public Task<string> GenerateUploadUrlAsync(
        string objectKey, string contentType, long contentLength, TimeSpan expiration, CancellationToken cancellationToken = default)
        => Task.FromResult($"https://storage.test/upload/{objectKey}");
}
