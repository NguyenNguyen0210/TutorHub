using TutorHub.Domain.Enums;

namespace TutorHub.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    Guid? TutorProfileId { get; }
    Guid? StudentProfileId { get; }
    bool IsAuthenticated { get; }

    /// <summary>
    /// Returns the authenticated user's id or throws <see cref="Exceptions.UnauthorizedException"/>
    /// when the request is unauthenticated / the id claim is missing or malformed.
    /// </summary>
    Guid UserIdOrThrow();
}
