using MediatR;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.DeleteMedia;

public record DeleteMediaCommand(
    Guid MediaId,
    Guid UserId,
    UserRole UserRole
) : IRequest<bool>;
