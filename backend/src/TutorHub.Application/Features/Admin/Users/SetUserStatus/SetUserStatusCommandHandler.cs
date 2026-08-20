using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.SetUserStatus;

public class SetUserStatusCommandHandler : IRequestHandler<SetUserStatusCommand, AdminUserSummaryDto>
{
    private readonly IAppDbContext _context;

    public SetUserStatusCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminUserSummaryDto> Handle(SetUserStatusCommand request, CancellationToken cancellationToken)
    {
        // 1. Self-lockout Invariant: Admin cannot deactivate themselves
        if (request.UserId == request.AdminId && !request.IsActive)
        {
            throw new ConflictException("Admin cannot deactivate their own account.");
        }

        // 2. Find target user
        var user = await _context.Users
            .Include(u => u.TutorProfile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        // 3. Last Active Admin Invariant
        if (user.Role == UserRole.Admin && !request.IsActive && user.IsActive)
        {
            var activeAdminCount = await _context.Users
                .CountAsync(u => u.Role == UserRole.Admin && u.IsActive, cancellationToken);

            if (activeAdminCount <= 1)
            {
                throw new ConflictException("Cannot deactivate the last active administrator on the platform.");
            }
        }

        // 4. Update status
        user.IsActive = request.IsActive;

        // 5. Active Refresh Tokens Revocation (when deactivating)
        if (!request.IsActive)
        {
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            var nowUtc = DateTime.UtcNow;
            foreach (var token in activeTokens)
            {
                token.RevokedAt = nowUtc;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminUserSummaryDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Phone: user.Phone,
            AvatarUrl: user.AvatarUrl,
            Role: user.Role,
            IsActive: user.IsActive,
            CreatedAt: user.CreatedAt,
            TutorStatus: user.TutorProfile?.Status
        );
    }
}
