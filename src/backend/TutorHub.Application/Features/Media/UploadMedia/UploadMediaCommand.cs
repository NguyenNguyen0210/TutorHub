using MediatR;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.UploadMedia;

public record UploadMediaCommand(
    Stream Stream,
    string OriginalFileName,
    string DeclaredContentType,
    long FileSize,
    MediaType MediaType,
    Guid UserId,
    UserRole UserRole
) : IRequest<MediaDto>;
