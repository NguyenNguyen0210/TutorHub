using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.Models;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Auth.RefreshToken;

public record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken,
    string? IpAddress = null
) : IRequest<AuthResponseDto>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IJwtService _jwtService;

    public RefreshTokenCommandHandler(
        IAppDbContext context,
        IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
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
        // If an already-revoked refresh token is received, it means the token was compromised!
        // Immediately revoke all existing active tokens for this user to protect the account.
        // =========================================================================
        if (existingToken.IsRevoked)
        {
            var compromisedTokens = await _context.RefreshTokens
                .Where(r => r.UserId == existingToken.UserId && r.RevokedAt == null && r.ExpiresAt > DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var token in compromisedTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = request.IpAddress;
                token.ReasonRevoked = $"Compromised by token reuse attempt of token {existingToken.Id}";
            }

            await _context.SaveChangesAsync(cancellationToken);

            throw new UnauthorizedException("Security Alert: Invalid refresh token reuse detected. All active sessions have been terminated.");
        }

        if (existingToken.IsExpired)
        {
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        if (!existingToken.User.IsActive)
        {
            throw new UnauthorizedException("Your account has been deactivated.");
        }

        // Generate new Access Token & new Refresh Token
        var newAccessToken = _jwtService.GenerateAccessToken(
            existingToken.User,
            existingToken.User.TutorProfile?.Id,
            existingToken.User.StudentProfile?.Id
        );

        var newRawRefreshToken = _jwtService.GenerateRefreshToken();

        // Rotate: Revoke the current token and link it to the new token
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.RevokedByIp = request.IpAddress;
        existingToken.ReplacedByToken = newRawRefreshToken;
        existingToken.ReasonRevoked = "Rotated to new refresh token";

        var newRefreshTokenEntity = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existingToken.UserId,
            Token = newRawRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = request.IpAddress
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(
            existingToken.User.Id,
            existingToken.User.Email,
            existingToken.User.FullName,
            existingToken.User.Phone,
            existingToken.User.Role.ToString(),
            existingToken.User.AvatarUrl,
            existingToken.User.TutorProfile?.Id,
            existingToken.User.StudentProfile?.Id
        );

        return new AuthResponseDto(
            AccessToken: newAccessToken,
            RefreshToken: newRawRefreshToken,
            TokenType: "Bearer",
            ExpiresIn: 15 * 60,
            User: userDto
        );
    }
}
