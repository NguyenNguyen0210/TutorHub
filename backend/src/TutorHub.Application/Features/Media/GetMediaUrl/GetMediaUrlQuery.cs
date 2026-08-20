using MediatR;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GetMediaUrl;

public record GetMediaUrlQuery(
    Guid MediaId,
    Guid UserId,
    UserRole UserRole
) : IRequest<MediaDto>;
