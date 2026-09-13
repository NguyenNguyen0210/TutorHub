using MediatR;
using TutorHub.Application.Features.Media.DTOs;

namespace TutorHub.Application.Features.Media.GetMediaUrl;

public record GetMediaUrlQuery(
    Guid MediaId
) : IRequest<MediaDto>;
