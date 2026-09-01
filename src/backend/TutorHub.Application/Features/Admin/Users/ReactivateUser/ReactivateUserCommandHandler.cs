using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Admin.Users.ReactivateUser;

public class ReactivateUserCommandHandler : IRequestHandler<ReactivateUserCommand, AdminUserSummaryDto>
{
    private readonly IAppDbContext _context;

    public ReactivateUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminUserSummaryDto> Handle(ReactivateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Find target user
        var user = await _context.Users
            .Include(u => u.TutorProfile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        // 2. Domain state transition (enforces Suspended -> Active)
        var previousStatus = user.Status;
        try
        {
            user.Reactivate();
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        var nowUtc = DateTime.UtcNow;

        // 3. Audit Trail
        var auditLog = new AccountStatusAuditLog
        {
            Id = Guid.NewGuid(),
            TargetUserId = user.Id,
            AdminUserId = request.AdminId,
            PreviousStatus = previousStatus,
            NewStatus = user.Status,
            Reason = "Reactivated by administrator",
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
