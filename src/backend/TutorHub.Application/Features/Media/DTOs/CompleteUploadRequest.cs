using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.DTOs;

public record CompleteUploadRequest(
    string ObjectKey,
    string OriginalFileName,
    string ContentType,
    long FileSize,
    MediaType MediaType
);
