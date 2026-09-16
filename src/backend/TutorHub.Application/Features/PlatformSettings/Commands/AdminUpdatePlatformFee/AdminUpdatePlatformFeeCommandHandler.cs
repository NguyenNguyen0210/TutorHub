using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;
using TutorHub.Application.Features.PlatformSettings.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;

public class AdminUpdatePlatformFeeCommandHandler : IRequestHandler<AdminUpdatePlatformFeeCommand, PlatformSettingDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public AdminUpdatePlatformFeeCommandHandler(
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

    public async Task<PlatformSettingDto> Handle(AdminUpdatePlatformFeeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var setting = await _context.PlatformSettings
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Key == PlatformSettingKeys.PlatformFeeRate, cancellationToken);

        var now = _clock.UtcNow;
        var newValueStr = request.NewFeeRate.ToString("F4", CultureInfo.InvariantCulture);

        // Captured before mutation so the audit trail records the real previous value.
        var previousValue = string.Empty;

        if (setting == null)
        {
            setting = new PlatformSetting
            {
                Id = Guid.NewGuid(),
                Key = PlatformSettingKeys.PlatformFeeRate,
                Value = newValueStr,
                Description = "Default platform commission percentage applied to session payouts.",
                CurrentVersion = 1,
                LastUpdatedByAdminId = userId,
                UpdatedAt = now
            };

            var initialVersion = new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = 1,
                Value = newValueStr,
                Reason = request.Reason,
                ChangedByAdminId = userId,
                EffectiveFrom = now,
                CreatedAt = now
            };

            setting.Versions.Add(initialVersion);
            _context.PlatformSettings.Add(setting);

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                PlatformSettingKeys.PlatformFeeRate,
                previousValue,
                newValueStr,
                1,
                userId));
        }
        else
        {
            previousValue = setting.Value;
            setting.CurrentVersion++;
            setting.Value = newValueStr;
            setting.LastUpdatedByAdminId = userId;
            setting.UpdatedAt = now;

            var version = new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = setting.CurrentVersion,
                Value = newValueStr,
                Reason = request.Reason,
                ChangedByAdminId = userId,
                EffectiveFrom = now,
                CreatedAt = now
            };

            setting.Versions.Add(version);

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                PlatformSettingKeys.PlatformFeeRate,
                previousValue,
                newValueStr,
                setting.CurrentVersion,
                userId));
        }

        // CLAUDE.md convention #6: admin platform-configuration changes are audited
        // with the correlation id of the request.
        await _auditLogService.LogAsync(
            action: "PlatformFeeRateUpdated",
            entityName: "PlatformSetting",
            entityId: setting.Id.ToString(),
            userId: userId,
            oldValues: new { Key = PlatformSettingKeys.PlatformFeeRate, Value = previousValue },
            newValues: new
            {
                Key = PlatformSettingKeys.PlatformFeeRate,
                Value = newValueStr,
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
