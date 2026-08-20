using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.DTOs;

public record GenerateUploadUrlRequest(
    string FileName,
    string ContentType,
    MediaType MediaType,
    long? EstimatedFileSize = null
);
