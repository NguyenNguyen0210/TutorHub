namespace TutorHub.Application.Common.Interfaces;

public record StoredFileResult(
    string ObjectKey,
    long Size,
    string ContentType,
    string? ETag
);