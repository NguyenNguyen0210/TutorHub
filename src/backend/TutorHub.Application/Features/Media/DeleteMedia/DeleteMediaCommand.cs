using MediatR;

namespace TutorHub.Application.Features.Media.DeleteMedia;

public record DeleteMediaCommand(
    Guid MediaId
) : IRequest<bool>;
