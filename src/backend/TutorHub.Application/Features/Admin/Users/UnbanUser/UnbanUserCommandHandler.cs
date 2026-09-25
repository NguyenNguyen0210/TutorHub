using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.UnbanUser;

public class UnbanUserCommandHandler : IRequestHandler<UnbanUserCommand, AdminUserSummaryDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public UnbanUserCommandHandler(
        IAppDbContext context,
        IClock clock,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<AdminUserSummaryDto> Handle(UnbanUserCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();

        // 1. Find target user
        var user = await _context.Users
            .Include(u => u.TutorApplications)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        // 2. Domain state transition (enforces Banned -> Active)
        var previousStatus = user.Status;
        try
        {
            user.Unban();
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        var nowUtc = _clock.UtcNow;

        // 3. Central Append-Only Audit Trail Logging
        await _auditLogService.LogAsync(
            action: "USER_UNBANNED",
            entityName: "User",
            entityId: user.Id.ToString(),
            userId: adminId,
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
            AbsentStrikes: user.AbsentStrikes,
            TutorApplicationStatus: latestAppStatus
        );
    }
}
