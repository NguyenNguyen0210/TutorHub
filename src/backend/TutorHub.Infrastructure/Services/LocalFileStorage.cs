using Microsoft.Extensions.Hosting;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services;

public class LocalFileStorage : IFileStorage
{
    private readonly string _storageDirectory;

    public LocalFileStorage(IHostEnvironment environment)
    {
        _storageDirectory = Path.Combine(environment.ContentRootPath, "uploads", "attachments");
        if (!Directory.Exists(_storageDirectory))
        {
            Directory.CreateDirectory(_storageDirectory);
        }
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        var uniqueKey = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(_storageDirectory, uniqueKey);

        using (var output = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(output, cancellationToken);
        }

        return uniqueKey;
    }

    public Task<Stream?> GetAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var sanitizedKey = Path.GetFileName(storageKey);
        var fullPath = Path.Combine(_storageDirectory, sanitizedKey);

        if (!File.Exists(fullPath))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var sanitizedKey = Path.GetFileName(storageKey);
        var fullPath = Path.Combine(_storageDirectory, sanitizedKey);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }
}
