using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.BanUser;

public class BanUserCommandHandler : IRequestHandler<BanUserCommand, AdminUserSummaryDto>
{
    private readonly IAppDbContext _context;

    public BanUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminUserSummaryDto> Handle(BanUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Self-lockout Invariant: Admin cannot ban themselves
        if (request.UserId == request.AdminId)
        {
            throw new ConflictException("Admin cannot ban their own account.");
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
        if (user.Role == UserRole.Admin && user.Status == AccountStatus.Active)
        {
            var activeAdminCount = await _context.Users
                .CountAsync(u => u.Role == UserRole.Admin && u.Status == AccountStatus.Active, cancellationToken);

            if (activeAdminCount <= 1)
            {
                throw new ConflictException("Cannot ban the last active administrator on the platform.");
            }
        }

        // 4. Domain state transition
        var previousStatus = user.Status;
        try
        {
            user.Ban();
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        var nowUtc = DateTime.UtcNow;

        // 5. Active Refresh Tokens Revocation
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = nowUtc;
        }

        // 6. Audit Trail
        var auditLog = new AccountStatusAuditLog
        {
            Id = Guid.NewGuid(),
            TargetUserId = user.Id,
            AdminUserId = request.AdminId,
            PreviousStatus = previousStatus,
            NewStatus = user.Status,
            Reason = request.Reason,
            Timestamp = nowUtc
        };

        _context.AccountStatusAuditLogs.Add(auditLog);

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminUserSummaryDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Phone: user.Phone,
            AvatarUrl: user.AvatarUrl,
            Role: user.Role,
            Status: user.Status,
            CreatedAt: user.CreatedAt,
            TutorStatus: user.TutorProfile?.Status
        );
    }
}
