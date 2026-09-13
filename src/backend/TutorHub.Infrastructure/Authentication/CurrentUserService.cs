using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Authentication;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : null;
        }
    }

    public string? Email =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
        ?? _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value;

    public UserRole? Role
    {
        get
        {
            var roleClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
                ?? _httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value;

            return Enum.TryParse<UserRole>(roleClaim, ignoreCase: true, out var role) ? role : null;
        }
    }

    public Guid? TutorProfileId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("tutor_profile_id")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public Guid? StudentProfileId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("student_profile_id")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public Guid UserIdOrThrow()
    {
        if (!IsAuthenticated || !UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        return UserId.Value;
    }
}
