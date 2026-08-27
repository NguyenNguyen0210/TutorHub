using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.DTOs;

public record MediaDto(
    Guid Id,
    string ObjectKey,
    string OriginalFileName,
    long FileSize,
    string ContentType,
    MediaType MediaType,
    bool IsPrivate,
    string? AccessUrl,
    DateTime CreatedAt
);
