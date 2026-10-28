using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Application.Common.Concurrency;
using TutorHub.Application.Common.Caching;

namespace TutorHub.Application.Features.Admin.Users.BanUser;

public class BanUserCommandHandler : IRequestHandler<BanUserCommand, AdminUserSummaryDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITutorProfileCacheService _tutorCache;
    private readonly IServiceDetailCacheService _serviceCache;

    public BanUserCommandHandler(
        IAppDbContext context,
        IClock clock,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService,
        ITutorProfileCacheService? tutorCache = null,
        IServiceDetailCacheService? serviceCache = null)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
        _tutorCache = tutorCache ?? NoOpTutorProfileCacheService.Instance;
        _serviceCache = serviceCache ?? NoOpServiceDetailCacheService.Instance;
    }

    public async Task<AdminUserSummaryDto> Handle(BanUserCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();

        await using var transaction = await PostgresAdvisoryLock.BeginTransactionAsync(_context, cancellationToken);
        await PostgresAdvisoryLock.AcquireAsync(_context, "admin:last-active", cancellationToken);

        // 1. Self-lockout Invariant: Admin cannot ban themselves
        if (request.UserId == adminId)
        {
            throw new ConflictException("Admin cannot ban their own account.");
        }

        // 2. Find target user
        var user = await _context.Users
            .Include(u => u.TutorApplications)
            .Include(u => u.TutorProfile).ThenInclude(t => t!.Services)
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


        var nowUtc = _clock.UtcNow;

        // 5. Active Refresh Tokens Revocation
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = nowUtc;
        }

        // 6. Central Append-Only Audit Trail Logging
        await _auditLogService.LogAsync(
            action: "USER_BANNED",
            entityName: "User",
            entityId: user.Id.ToString(),
            userId: adminId,
            oldValues: new { status = previousStatus.ToString() },
            newValues: new { status = user.Status.ToString(), reason = request.Reason },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        if (transaction != null)
            await transaction.CommitAsync(cancellationToken);

        if (user.TutorProfile != null)
        {
            await _tutorCache.InvalidateTutorProfileAsync(user.TutorProfile.Id, cancellationToken);
            foreach (var service in user.TutorProfile.Services)
                await _serviceCache.InvalidateServiceDetailAsync(service.Id, cancellationToken);
        }


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
