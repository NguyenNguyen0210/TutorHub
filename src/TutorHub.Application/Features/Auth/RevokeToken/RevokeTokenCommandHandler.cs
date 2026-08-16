using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Auth.RevokeToken;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand, bool>
{
    private readonly IAppDbContext _context;

    public RevokeTokenCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
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

        token.RevokedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
