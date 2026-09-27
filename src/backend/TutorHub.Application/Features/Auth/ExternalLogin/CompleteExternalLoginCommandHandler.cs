using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using RefreshTokenEntity = TutorHub.Domain.Entities.RefreshToken;
using ExternalLoginEntity = TutorHub.Domain.Entities.ExternalLogin;

namespace TutorHub.Application.Features.Auth.ExternalLogin;

/// <summary>
/// Turns a verified provider identity into the same tokens a password login returns.
/// </summary>
public class CompleteExternalLoginCommandHandler
    : IRequestHandler<CompleteExternalLoginCommand, AuthResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenHasher _refreshTokenHasher;
    private readonly IEnumerable<IExternalAuthProvider> _providers;
    private readonly IExternalAuthStateStore _stateStore;
    private readonly ExternalAuthOptions _options;
    private readonly AuthTokenLifetimeOptions _lifetimes;

    public CompleteExternalLoginCommandHandler(
        IAppDbContext context,
        IClock clock,
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IRefreshTokenHasher refreshTokenHasher,
        IEnumerable<IExternalAuthProvider> providers,
        IExternalAuthStateStore stateStore,
        IOptions<ExternalAuthOptions> options,
        IOptions<AuthTokenLifetimeOptions> lifetimeOptions)
    {
        _context = context;
        _clock = clock;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _refreshTokenHasher = refreshTokenHasher;
        _providers = providers;
        _stateStore = stateStore;
        _options = options.Value;
        _lifetimes = lifetimeOptions.Value;
    }

    public async Task<AuthResponseDto> Handle(CompleteExternalLoginCommand request, CancellationToken cancellationToken)
    {
        var provider = ExternalAuthProviderResolver.Resolve(_providers, request.Provider);

        if (!provider.IsConfigured)
        {
            throw new BadRequestException($"{provider.Provider} sign-in is not configured on this server.");
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            throw new BadRequestException("The provider did not return an authorization code.");
        }

        // Consume first: an unknown, expired, replayed, or wrong-provider state all
        // fail identically, so the response cannot be used to probe for valid states.
        var pending = _stateStore.Consume(request.State, provider.Provider, cancellationToken);
        if (pending is null)
        {
            throw new BadRequestException(
                "This sign-in link is no longer valid. It may have expired or already been used — please start again.");
        }

        var (clientId, clientSecret) = ResolveCredentials(provider);

        var identity = await provider.ExchangeCodeAsync(
            clientId,
            clientSecret,
            _options.RedirectUri,
            request.Code,
            pending.CodeVerifier,
            cancellationToken);

        if (identity.Provider != provider.Provider)
        {
            throw new BadRequestException("The sign-in provider does not match the one that started this flow.");
        }

        if (!identity.EmailVerified)
        {
            // Linking on an unverified address would let anyone who can set that
            // address at a provider take over the matching local account.
            throw new BadRequestException(
                $"{provider.Provider} has not verified the email address on this account, so TutorHub cannot sign you in. " +
                "Verify it with the provider and try again, or use email and password.");
        }

        var normalizedEmail = identity.Email.Trim().ToLowerInvariant();
        var now = _clock.UtcNow;

        var externalLogin = await _context.ExternalLogins
            .FirstOrDefaultAsync(l => l.Provider == identity.Provider && l.ProviderUserId == identity.ProviderUserId, cancellationToken);

        User user;
        ExternalLoginEntity loginEntry;

        if (externalLogin is not null)
        {
            user = await LoadUserAsync(externalLogin.UserId, cancellationToken)
                   ?? throw new UnauthorizedException("The account linked to this sign-in no longer exists.");
            loginEntry = externalLogin;
        }
        else
        {
            var existing = await _context.Users
                .Include(u => u.TutorProfile)
                .Include(u => u.StudentProfile)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

            if (existing is not null)
            {
                // Same verified address, already a local account: link, do not create a
                // duplicate, and keep the existing role so a Tutor stays a Tutor.
                user = existing;
            }
            else
            {
                user = CreateStudent(identity, normalizedEmail, now);
            }

            loginEntry = new ExternalLoginEntity
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Provider = identity.Provider,
                ProviderUserId = identity.ProviderUserId,
                EmailAtLinkTime = normalizedEmail,
                CreatedAt = now,
                LastLoginAt = now
            };
            _context.ExternalLogins.Add(loginEntry);
        }

        if (user.Status == AccountStatus.Suspended)
        {
            throw new UnauthorizedException("Your account has been suspended. Please contact support.");
        }

        if (user.Status == AccountStatus.Banned)
        {
            throw new UnauthorizedException("Your account has been banned.");
        }

        if (user.IsLockedOut(now))
        {
            throw new UnauthorizedException("This account is temporarily locked. Please try again later.");
        }

        if (user.AccessFailedCount > 0 || user.LockoutEndAt.HasValue)
        {
            user.ResetFailedLogin();
        }

        loginEntry.LastLoginAt = now;

        var tutorProfileId = user.TutorProfile?.Id;
        var studentProfileId = user.StudentProfile?.Id;

        var accessToken = _jwtService.GenerateAccessToken(user, tutorProfileId, studentProfileId);
        var rawRefreshToken = _jwtService.GenerateRefreshToken();

        _context.RefreshTokens.Add(new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _refreshTokenHasher.Hash(rawRefreshToken),
            ExpiresAt = now.AddDays(_lifetimes.RefreshTokenExpirationDays),
            CreatedAt = now
        });

        await _context.SaveChangesAsync(cancellationToken);

        var idProfile = user.Role == UserRole.Tutor ? tutorProfileId : studentProfileId;

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.AvatarUrl,
            idProfile,
            user.AbsentStrikes);

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            TokenType: "Bearer",
            ExpiresIn: _lifetimes.AccessTokenExpirationMinutes * 60,
            User: userDto);
    }

    private async Task<User?> LoadUserAsync(Guid userId, CancellationToken cancellationToken) =>
        await _context.Users
            .Include(u => u.TutorProfile)
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

    private User CreateStudent(ExternalIdentity identity, string normalizedEmail, DateTime now)
    {
        var userId = Guid.NewGuid();
        var studentProfileId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            Email = normalizedEmail,
            // `User.PasswordHash` is non-nullable. A hash of a fresh 64-byte secret
            // keeps the column valid while making password login impossible for this
            // account — nobody can guess the input. If the user later sets a password,
            // ChangePassword overwrites this and the account works both ways.
            PasswordHash = _passwordHasher.HashPassword(Convert.ToBase64String(RandomBytes())),
            FullName = FirstNonEmpty(identity.FullName, identity.Email),
            AvatarUrl = identity.AvatarUrl,
            Phone = null,
            // A new external sign-in is always a student. Becoming a tutor still goes
            // through the application and review, exactly as with a password account.
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = now
        };

        var studentProfile = new StudentProfile { Id = studentProfileId, UserId = userId };
        user.StudentProfile = studentProfile;

        _context.Users.Add(user);
        _context.StudentProfiles.Add(studentProfile);

        return user;
    }

    private (string ClientId, string ClientSecret) ResolveCredentials(IExternalAuthProvider provider) =>
        provider.Provider == ExternalAuthProvider.Facebook
            ? (_options.Facebook.ClientId, _options.Facebook.ClientSecret)
            : (_options.Google.ClientId, _options.Google.ClientSecret);

    private static string FirstNonEmpty(string? preferred, string fallback) =>
        string.IsNullOrWhiteSpace(preferred) ? fallback : preferred.Trim();

    private static byte[] RandomBytes() => System.Security.Cryptography.RandomNumberGenerator.GetBytes(64);
}
