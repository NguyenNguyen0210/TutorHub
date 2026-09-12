using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Auth.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IJwtService _jwtService;
    private readonly AuthTokenLifetimeOptions _lifetimes;

    public RefreshTokenCommandHandler(
        IAppDbContext context, IClock clock,
        IJwtService jwtService,
        IOptions<AuthTokenLifetimeOptions> lifetimeOptions)
    {
        _context = context;
        _clock = clock;
        _jwtService = jwtService;
        _lifetimes = lifetimeOptions.Value;
    }

    public async Task<RefreshTokenResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var existingToken = await _context.RefreshTokens
            .Include(r => r.User)
                .ThenInclude(u => u.TutorProfile)
            .Include(r => r.User)
                .ThenInclude(u => u.StudentProfile)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

        if (existingToken == null)
        {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        // =========================================================================
        // REPLAY ATTACK DETECTION (Token Reuse)
        // If an already-revoked refresh token is received, it means the token was compromised.
        // Immediately revoke all existing active tokens for this user to protect the account.
        // =========================================================================
        if (existingToken.IsRevoked)
        {
            var compromisedTokens = await _context.RefreshTokens
                .Where(r => r.UserId == existingToken.UserId && r.RevokedAt == null && r.ExpiresAt > _clock.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var token in compromisedTokens)
            {
                token.RevokedAt = _clock.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            throw new UnauthorizedException("Security Alert: Invalid refresh token reuse detected. All active sessions have been terminated.");
        }

        if (existingToken.IsExpired)
        {
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        if (existingToken.User.Status == Domain.Enums.AccountStatus.Suspended)
        {
            throw new UnauthorizedException("Your account has been suspended. Please contact support.");
        }

        if (existingToken.User.Status == Domain.Enums.AccountStatus.Banned)
        {
            throw new UnauthorizedException("Your account has been banned.");
        }

        // Generate new Access Token & new Refresh Token
        var newAccessToken = _jwtService.GenerateAccessToken(
            existingToken.User,
            existingToken.User.TutorProfile?.Id,
            existingToken.User.StudentProfile?.Id
        );

        var newRawRefreshToken = _jwtService.GenerateRefreshToken();

        // Rotate: Revoke the current token
        existingToken.RevokedAt = _clock.UtcNow;

        var newRefreshTokenEntity = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existingToken.UserId,
            Token = newRawRefreshToken,
            ExpiresAt = _clock.UtcNow.AddDays(_lifetimes.RefreshTokenExpirationDays),
            CreatedAt = _clock.UtcNow
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        var expiresAt = _clock.UtcNow.AddMinutes(_lifetimes.AccessTokenExpirationMinutes);

        return new RefreshTokenResponseDto(
            AccessToken: newAccessToken,
            RefreshToken: newRawRefreshToken,
            ExpiresAt: expiresAt
        );
    }
}
