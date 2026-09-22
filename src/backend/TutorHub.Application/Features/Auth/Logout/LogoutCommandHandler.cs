using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;

namespace TutorHub.Application.Features.Auth.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IRefreshTokenHasher _refreshTokenHasher;

    public LogoutCommandHandler(IAppDbContext context, IClock clock, IRefreshTokenHasher refreshTokenHasher)
    {
        _context = context;
        _clock = clock;
        _refreshTokenHasher = refreshTokenHasher;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        // P0-D1: match on the stored hash, never on the raw token.
        var presentedTokenHash = _refreshTokenHasher.Hash(request.RefreshToken);

        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.TokenHash == presentedTokenHash, cancellationToken);

        if (token == null)
        {
            throw new NotFoundException("Refresh token not found.");
        }

        if (!token.IsActive)
        {
            return true;
        }

        token.RevokedAt = _clock.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
