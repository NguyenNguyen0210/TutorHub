using MediatR;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.CompleteUpload;

public record CompleteUploadCommand(
    string ObjectKey,
    string OriginalFileName,
    string ContentType,
    long FileSize,
    MediaType MediaType
) : IRequest<MediaDto>;
