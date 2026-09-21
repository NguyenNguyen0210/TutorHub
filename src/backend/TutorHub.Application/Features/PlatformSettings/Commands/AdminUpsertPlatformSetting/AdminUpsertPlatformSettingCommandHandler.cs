using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;

public class AdminUpsertPlatformSettingCommandHandler : IRequestHandler<AdminUpsertPlatformSettingCommand, PlatformSettingDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public AdminUpsertPlatformSettingCommandHandler(
        IAppDbContext context,
        IClock clock,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<PlatformSettingDto> Handle(AdminUpsertPlatformSettingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        // Validator already whitelists Key; re-check defensively for direct MediatR dispatch.
        if (!PlatformSettingKeys.All.Contains(request.Key))
        {
            throw new Common.Exceptions.BadRequestException($"Setting key '{request.Key}' is not configurable.");
        }

        var setting = await _context.PlatformSettings
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Key == request.Key, cancellationToken);

        var now = _clock.UtcNow;

        // Captured before mutation so the audit trail records the real previous value.
        var previousValue = string.Empty;

        if (setting == null)
        {
            setting = new PlatformSetting
            {
                Id = Guid.NewGuid(),
                Key = request.Key,
                Value = request.Value.Trim(),
                Description = $"Generic platform policy (F-17 plumbing; semantics pending product decision).",
                CurrentVersion = 1,
                LastUpdatedByAdminId = userId,
                UpdatedAt = now
            };

            setting.Versions.Add(new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = 1,
                Value = setting.Value,
                Reason = request.Reason,
                ChangedByAdminId = userId,
                EffectiveFrom = now,
                CreatedAt = now
            });

            _context.PlatformSettings.Add(setting);

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                request.Key,
                previousValue,
                setting.Value,
                1,
                userId));
        }
        else
        {
            previousValue = setting.Value;
            setting.CurrentVersion++;
            setting.Value = request.Value.Trim();
            setting.LastUpdatedByAdminId = userId;
            setting.UpdatedAt = now;

            setting.Versions.Add(new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = setting.CurrentVersion,
                Value = setting.Value,
                Reason = request.Reason,
                ChangedByAdminId = userId,
                EffectiveFrom = now,
                CreatedAt = now
            });

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                request.Key,
                previousValue,
                setting.Value,
                setting.CurrentVersion,
                userId));
        }

        // CLAUDE.md convention #6: admin platform-configuration changes are audited.
        await _auditLogService.LogAsync(
            action: "PlatformSettingUpdated",
            entityName: "PlatformSetting",
            entityId: setting.Id.ToString(),
            userId: userId,
            oldValues: new { Key = request.Key, Value = previousValue },
            newValues: new
            {
                Key = request.Key,
                Value = setting.Value,
                Reason = request.Reason,
                Version = setting.CurrentVersion
            },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return new PlatformSettingDto
        {
            Id = setting.Id,
            Key = setting.Key,
            Value = setting.Value,
            Description = setting.Description,
            CurrentVersion = setting.CurrentVersion,
            UpdatedAt = setting.UpdatedAt,
            Versions = setting.Versions.OrderByDescending(v => v.Version).Select(v => new PlatformSettingVersionDto
            {
                Id = v.Id,
                Version = v.Version,
                Value = v.Value,
                Reason = v.Reason,
                ChangedByAdminId = v.ChangedByAdminId,
                EffectiveFrom = v.EffectiveFrom,
                CreatedAt = v.CreatedAt
            }).ToList()
        };
    }
}
