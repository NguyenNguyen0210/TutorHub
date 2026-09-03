namespace TutorHub.Domain.Entities;

public class PlatformSettingVersion
{
    public Guid Id { get; set; }

    public Guid PlatformSettingId { get; set; }
    public PlatformSetting PlatformSetting { get; set; } = default!;

    public int Version { get; set; }

    public string Value { get; set; } = string.Empty;

    public string? Reason { get; set; }

    public Guid ChangedByAdminId { get; set; }

    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
