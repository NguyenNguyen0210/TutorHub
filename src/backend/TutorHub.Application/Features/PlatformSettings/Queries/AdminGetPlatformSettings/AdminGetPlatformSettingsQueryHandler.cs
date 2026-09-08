using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.DTOs;

namespace TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformSettings;

public class AdminGetPlatformSettingsQueryHandler : IRequestHandler<AdminGetPlatformSettingsQuery, List<PlatformSettingDto>>
{
    private readonly IAppDbContext _context;

    public AdminGetPlatformSettingsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PlatformSettingDto>> Handle(AdminGetPlatformSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.PlatformSettings
            .AsNoTracking()
            .Include(s => s.Versions)
            .OrderBy(s => s.Key)
            .ToListAsync(cancellationToken);

        return settings.Select(s => new PlatformSettingDto
        {
            Id = s.Id,
            Key = s.Key,
            Value = s.Value,
            Description = s.Description,
            CurrentVersion = s.CurrentVersion,
            UpdatedAt = s.UpdatedAt,
            Versions = s.Versions.OrderByDescending(v => v.Version).Select(v => new PlatformSettingVersionDto
            {
                Id = v.Id,
                Version = v.Version,
                Value = v.Value,
                Reason = v.Reason,
                ChangedByAdminId = v.ChangedByAdminId,
                EffectiveFrom = v.EffectiveFrom,
                CreatedAt = v.CreatedAt
            }).ToList()
        }).ToList();
    }
}
