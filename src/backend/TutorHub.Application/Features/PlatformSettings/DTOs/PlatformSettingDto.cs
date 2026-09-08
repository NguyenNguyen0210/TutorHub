namespace TutorHub.Application.Features.PlatformSettings.DTOs;

public class PlatformSettingDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CurrentVersion { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<PlatformSettingVersionDto> Versions { get; set; } = new();
}

public class PlatformSettingVersionDto
{
    public Guid Id { get; set; }
    public int Version { get; set; }
    public string Value { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public Guid ChangedByAdminId { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime CreatedAt { get; set; }
}
