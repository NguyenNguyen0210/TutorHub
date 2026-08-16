using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.Models;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using RefreshTokenEntity = TutorHub.Domain.Entities.RefreshToken;

namespace TutorHub.Application.Features.Auth.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public RegisterCommandHandler(
        IAppDbContext context,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            throw new ConflictException($"User with email '{request.Email}' already exists.");
        }

        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = request.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim(),
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        Guid? tutorProfileId = null;
        Guid? studentProfileId = null;

        if (request.Role == UserRole.Tutor)
        {
            tutorProfileId = Guid.NewGuid();
            var tutorProfile = new TutorProfile
            {
                Id = tutorProfileId.Value,
                UserId = userId,
                Bio = string.Empty,
                Education = string.Empty,
                ExperienceYears = 0,
                HourlyRate = 0,
                TeachingMode = TeachingMode.Online,
                Status = TutorProfileStatus.PendingReview,
                RatingAvg = 0,
                TotalReviews = 0
            };

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                TutorProfileId = tutorProfileId.Value,
                PendingBalance = 0,
                AvailableBalance = 0,
                UpdatedAt = DateTime.UtcNow
            };

            user.TutorProfile = tutorProfile;
            _context.TutorProfiles.Add(tutorProfile);
            _context.Wallets.Add(wallet);
        }
        else if (request.Role == UserRole.Student)
        {
            studentProfileId = Guid.NewGuid();
            var studentProfile = new StudentProfile
            {
                Id = studentProfileId.Value,
                UserId = userId
            };

            user.StudentProfile = studentProfile;
            _context.StudentProfiles.Add(studentProfile);
        }

        _context.Users.Add(user);

        // Generate Access & Refresh Tokens
        var accessToken = _jwtService.GenerateAccessToken(user, tutorProfileId, studentProfileId);
        var rawRefreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = rawRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.AvatarUrl,
            tutorProfileId,
            studentProfileId
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
