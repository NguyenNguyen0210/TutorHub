using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using RefreshTokenEntity = TutorHub.Domain.Entities.RefreshToken;

namespace TutorHub.Application.Features.Auth.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(
        IAppDbContext context,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.TutorProfile)
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("Your account has been deactivated. Please contact support.");
        }

        Guid? tutorProfileId = user.TutorProfile?.Id;
        Guid? studentProfileId = user.StudentProfile?.Id;

        var accessToken = _jwtService.GenerateAccessToken(user, tutorProfileId, studentProfileId);
        var rawRefreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = rawRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
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
            idProfile
        );

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            TokenType: "Bearer",
            ExpiresIn: 15 * 60,
            User: userDto
        );
    }
}
