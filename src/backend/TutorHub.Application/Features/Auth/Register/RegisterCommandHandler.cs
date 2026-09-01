using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(
        IAppDbContext context,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
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
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        if (request.Role == UserRole.Tutor)
        {
            var tutorProfileId = Guid.NewGuid();
            var tutorProfile = new TutorProfile
            {
                Id = tutorProfileId,
                UserId = userId,
                Bio = string.Empty,
                Education = string.Empty,
                ExperienceYears = 0,
                HourlyRate = 0,
                TeachingMode = TeachingMode.Online,
                Status = TutorProfileStatus.Draft,
                RatingAvg = 0,
                TotalReviews = 0
            };

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                TutorProfileId = tutorProfileId,
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
            var studentProfileId = Guid.NewGuid();
            var studentProfile = new StudentProfile
            {
                Id = studentProfileId,
                UserId = userId
            };

            user.StudentProfile = studentProfile;
            _context.StudentProfiles.Add(studentProfile);
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return new RegisterResponseDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString()
        );
    }
}
