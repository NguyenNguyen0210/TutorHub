using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Auth.RevokeToken;

public record RevokeTokenCommand(
    string RefreshToken,
    string? IpAddress = null
) : IRequest<bool>;

public class RevokeTokenCommandValidator : AbstractValidator<RevokeTokenCommand>
{
    public RevokeTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}

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
        token.RevokedByIp = request.IpAddress;
        token.ReasonRevoked = "Revoked by user logout";

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
