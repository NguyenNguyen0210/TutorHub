using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;

public class AdminUpdatePlatformFeeCommandHandler : IRequestHandler<AdminUpdatePlatformFeeCommand, PlatformSettingDto>
{
    private readonly IAppDbContext _context;

    public const string PlatformFeeKey = "PlatformFeeRate";

    public AdminUpdatePlatformFeeCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PlatformSettingDto> Handle(AdminUpdatePlatformFeeCommand request, CancellationToken cancellationToken)
    {
        var setting = await _context.PlatformSettings
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Key == PlatformFeeKey, cancellationToken);

        var now = DateTime.UtcNow;
        var newValueStr = request.NewFeeRate.ToString("F4", CultureInfo.InvariantCulture);

        if (setting == null)
        {
            setting = new PlatformSetting
            {
                Id = Guid.NewGuid(),
                Key = PlatformFeeKey,
                Value = newValueStr,
                Description = "Default platform commission percentage applied to session payouts.",
                CurrentVersion = 1,
                LastUpdatedByAdminId = request.AdminUserId,
                UpdatedAt = now
            };

            var initialVersion = new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = 1,
                Value = newValueStr,
                Reason = request.Reason,
                ChangedByAdminId = request.AdminUserId,
                EffectiveFrom = now,
                CreatedAt = now
            };

            setting.Versions.Add(initialVersion);
            _context.PlatformSettings.Add(setting);

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                PlatformFeeKey,
                "0.1000",
                newValueStr,
                1,
                request.AdminUserId));
        }
        else
        {
            var oldVal = setting.Value;
            setting.CurrentVersion++;
            setting.Value = newValueStr;
            setting.LastUpdatedByAdminId = request.AdminUserId;
            setting.UpdatedAt = now;

            var version = new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = setting.CurrentVersion,
                Value = newValueStr,
                Reason = request.Reason,
                ChangedByAdminId = request.AdminUserId,
                EffectiveFrom = now,
                CreatedAt = now
            };

            setting.Versions.Add(version);

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                PlatformFeeKey,
                oldVal,
                newValueStr,
                setting.CurrentVersion,
                request.AdminUserId));
        }

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
