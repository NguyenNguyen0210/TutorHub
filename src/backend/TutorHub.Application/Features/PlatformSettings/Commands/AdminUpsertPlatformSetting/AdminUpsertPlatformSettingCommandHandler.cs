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

    public AdminUpsertPlatformSettingCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<PlatformSettingDto> Handle(AdminUpsertPlatformSettingCommand request, CancellationToken cancellationToken)
    {
        // Validator already whitelists Key; re-check defensively for direct MediatR dispatch.
        if (!PlatformSettingKeys.All.Contains(request.Key))
        {
            throw new Common.Exceptions.BadRequestException($"Setting key '{request.Key}' is not configurable.");
        }

        var setting = await _context.PlatformSettings
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Key == request.Key, cancellationToken);

        var now = _clock.UtcNow;

        if (setting == null)
        {
            setting = new PlatformSetting
            {
                Id = Guid.NewGuid(),
                Key = request.Key,
                Value = request.Value.Trim(),
                Description = $"Generic platform policy (F-17 plumbing; semantics pending product decision).",
                CurrentVersion = 1,
                LastUpdatedByAdminId = request.AdminUserId,
                UpdatedAt = now
            };

            setting.Versions.Add(new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = 1,
                Value = setting.Value,
                Reason = request.Reason,
                ChangedByAdminId = request.AdminUserId,
                EffectiveFrom = now,
                CreatedAt = now
            });

            _context.PlatformSettings.Add(setting);

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                request.Key,
                string.Empty,
                setting.Value,
                1,
                request.AdminUserId));
        }
        else
        {
            var oldVal = setting.Value;
            setting.CurrentVersion++;
            setting.Value = request.Value.Trim();
            setting.LastUpdatedByAdminId = request.AdminUserId;
            setting.UpdatedAt = now;

            setting.Versions.Add(new PlatformSettingVersion
            {
                Id = Guid.NewGuid(),
                PlatformSettingId = setting.Id,
                Version = setting.CurrentVersion,
                Value = setting.Value,
                Reason = request.Reason,
                ChangedByAdminId = request.AdminUserId,
                EffectiveFrom = now,
                CreatedAt = now
            });

            _context.AddOutboxMessage(new PlatformSettingChangedEvent(
                request.Key,
                oldVal,
                setting.Value,
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
