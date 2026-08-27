namespace TutorHub.Application.Features.Media.DTOs;

public record UploadUrlDto(
    string UploadUrl,
    string ObjectKey,
    int ExpiresInMinutes
);
