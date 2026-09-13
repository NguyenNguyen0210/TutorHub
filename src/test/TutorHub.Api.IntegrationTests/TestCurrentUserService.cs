using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// Ambient current-user for integration tests. Handlers no longer receive the
/// acting user id as a command parameter, so tests must establish it before
/// sending a request. Defaults to an authenticated Admin.
/// </summary>
public sealed class TestCurrentUserService : ICurrentUserService
{
    public Guid? UserId { get; private set; } = Guid.NewGuid();
    public string? Email { get; private set; } = "integration@tutorhub.local";
    public UserRole? Role { get; private set; } = UserRole.Admin;
    public Guid? TutorProfileId { get; private set; }
    public Guid? StudentProfileId { get; private set; }
    public bool IsAuthenticated { get; private set; } = true;

    public void Set(
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
