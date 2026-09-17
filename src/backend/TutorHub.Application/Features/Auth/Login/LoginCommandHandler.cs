using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using RefreshTokenEntity = TutorHub.Domain.Entities.RefreshToken;

namespace TutorHub.Application.Features.Auth.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenHasher _refreshTokenHasher;
    private readonly AuthTokenLifetimeOptions _lifetimes;
    private readonly AuthLockoutOptions _lockout;

    public LoginCommandHandler(
        IAppDbContext context, IClock clock,
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IRefreshTokenHasher refreshTokenHasher,
        IOptions<AuthTokenLifetimeOptions> lifetimeOptions,
        IOptions<AuthLockoutOptions> lockoutOptions)
    {
        _context = context;
        _clock = clock;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _refreshTokenHasher = refreshTokenHasher;
        _lifetimes = lifetimeOptions.Value;
        _lockout = lockoutOptions.Value;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.TutorProfile)
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        var now = _clock.UtcNow;

        // P0-D3: a locked account is rejected with the same generic message as a wrong
        // password, so the response cannot be used to enumerate accounts.
        if (user != null && user.IsLockedOut(now))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            if (user != null)
            {
                user.RegisterFailedLogin(now, _lockout.MaxFailedAttempts, TimeSpan.FromMinutes(_lockout.LockoutMinutes));

                // Persist BEFORE throwing: otherwise the failed attempt is silently lost
                // and the lockout threshold could never be reached.
                await _context.SaveChangesAsync(cancellationToken);
            }

            throw new UnauthorizedException("Invalid email or password.");
        }

        if (user.Status == AccountStatus.Suspended)
        {
            throw new UnauthorizedException("Your account has been suspended. Please contact support.");
        }

        if (user.Status == AccountStatus.Banned)
        {
            throw new UnauthorizedException("Your account has been banned.");
        }

        // Successful authentication clears the brute-force counters (P0-D3). It is
        // persisted by the same SaveChangesAsync that stores the new refresh token.
        if (user.AccessFailedCount > 0 || user.LockoutEndAt.HasValue)
        {
            user.ResetFailedLogin();
        }

        Guid? tutorProfileId = user.TutorProfile?.Id;
        Guid? studentProfileId = user.StudentProfile?.Id;

        var accessToken = _jwtService.GenerateAccessToken(user, tutorProfileId, studentProfileId);
        var rawRefreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _refreshTokenHasher.Hash(rawRefreshToken),
            ExpiresAt = _clock.UtcNow.AddDays(_lifetimes.RefreshTokenExpirationDays),
            CreatedAt = _clock.UtcNow
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);
        Guid? idProfile;
        if (user.Role == UserRole.Tutor)
        {
            idProfile = tutorProfileId;
        }
        else
        {
            idProfile = studentProfileId;
        }
        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.AvatarUrl,
            idProfile,
            user.AbsentStrikes
        );

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            TokenType: "Bearer",
            ExpiresIn: _lifetimes.AccessTokenExpirationMinutes * 60,
            User: userDto
        );
    }
}
