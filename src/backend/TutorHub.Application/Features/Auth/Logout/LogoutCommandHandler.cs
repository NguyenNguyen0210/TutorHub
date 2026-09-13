using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Auth.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public LogoutCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

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
