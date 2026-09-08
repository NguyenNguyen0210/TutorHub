namespace TutorHub.Domain.Entities;

public class PlatformSetting
{
    public Guid Id { get; set; }

    public string Key { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int CurrentVersion { get; set; } = 1;

    public Guid? LastUpdatedByAdminId { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PlatformSettingVersion> Versions { get; set; } = new List<PlatformSettingVersion>();
}
