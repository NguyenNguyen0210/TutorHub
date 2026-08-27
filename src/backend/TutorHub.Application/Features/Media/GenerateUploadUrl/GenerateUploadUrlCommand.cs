using MediatR;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GenerateUploadUrl;

public record GenerateUploadUrlCommand(
    string FileName,
    string ContentType,
    long? EstimatedSize,
    MediaType MediaType,
    Guid UserId,
    UserRole UserRole
) : IRequest<UploadUrlDto>;
