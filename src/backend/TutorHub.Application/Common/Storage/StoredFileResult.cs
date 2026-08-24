namespace TutorHub.Application.Common.Storage;

public record StoredFileResult(
    string ObjectKey,
    long Size,
    string ContentType,
    string? ETag
);