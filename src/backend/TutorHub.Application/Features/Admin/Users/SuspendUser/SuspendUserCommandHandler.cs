using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.SuspendUser;

public class SuspendUserCommandHandler : IRequestHandler<SuspendUserCommand, AdminUserSummaryDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;

    public SuspendUserCommandHandler(IAppDbContext context, IClock clock, IAuditLogService auditLogService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
    }

    public async Task<AdminUserSummaryDto> Handle(SuspendUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Self-lockout Invariant: Admin cannot suspend themselves
        if (request.UserId == request.AdminId)
        {
            throw new ConflictException("Admin cannot suspend their own account.");
        }

        // 2. Find target user
        var user = await _context.Users
            .Include(u => u.TutorApplications)
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
                throw new ConflictException("Cannot suspend the last active administrator on the platform.");
            }
        }

        var previousStatus = user.Status;

        // 4. Domain state transition (enforces state validity)
        try
        {
            user.Suspend();
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        // 5. Active Refresh Tokens Revocation (Side-effect)
        var nowUtc = _clock.UtcNow;
        var activeTokens = await _context.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null && t.ExpiresAt > nowUtc)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = nowUtc;
        }

        // 6. Central Append-Only Audit Trail Logging
        await _auditLogService.LogAsync(
            action: "USER_SUSPENDED",
            entityName: "User",
            entityId: user.Id.ToString(),
            userId: request.AdminId,
            oldValues: new { status = previousStatus.ToString() },
            newValues: new { status = user.Status.ToString(), reason = request.Reason },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var latestAppStatus = user.TutorApplications
            .OrderBy(a => a.Status == TutorApplicationStatus.Approved ? 0 : a.Status == TutorApplicationStatus.Pending ? 1 : 2)
            .ThenByDescending(a => a.SubmittedAt)
            .Select(a => a.Status.ToString())
            .FirstOrDefault();

        return new AdminUserSummaryDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Phone: user.Phone,
            AvatarUrl: user.AvatarUrl,
            Role: user.Role,
            Status: user.Status,
            CreatedAt: user.CreatedAt,
            TutorApplicationStatus: latestAppStatus
        );
    }
}
