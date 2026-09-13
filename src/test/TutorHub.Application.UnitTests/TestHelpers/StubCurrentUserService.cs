using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.TestHelpers;

/// <summary>
/// Mutable ambient current-user for unit tests. Defaults to an authenticated
/// Admin unless configured, and supports explicit state via <see cref="Set"/>.
/// </summary>
public sealed class StubCurrentUserService : ICurrentUserService
{
    public Guid? UserId { get; private set; } = Guid.NewGuid();
    public string? Email { get; private set; } = "test@tutorhub.local";
    public UserRole? Role { get; private set; } = UserRole.Admin;
    public Guid? TutorProfileId { get; private set; }
    public Guid? StudentProfileId { get; private set; }
    public bool IsAuthenticated { get; private set; } = true;

    public StubCurrentUserService Set(
        Guid? userId,
        UserRole? role = null,
        bool isAuthenticated = true,
        Guid? tutorProfileId = null,
        Guid? studentProfileId = null)
    {
        UserId = userId;
        Role = role;
        IsAuthenticated = isAuthenticated;
        TutorProfileId = tutorProfileId;
        StudentProfileId = studentProfileId;
        return this;
    }

    public Guid UserIdOrThrow()
    {
        if (!IsAuthenticated || !UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        return UserId.Value;
    }
}
