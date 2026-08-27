using System.Security.Claims;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Common.Security;

public interface IJwtService
{
    string GenerateAccessToken(User user, Guid? tutorProfileId = null, Guid? studentProfileId = null);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
