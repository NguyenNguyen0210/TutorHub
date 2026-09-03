using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class PlatformSettingConfiguration : IEntityTypeConfiguration<PlatformSetting>
{
    public void Configure(EntityTypeBuilder<PlatformSetting> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Key)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.Value)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        builder.Property(s => s.CurrentVersion)
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .IsRequired();

        builder.HasIndex(s => s.Key)
            .IsUnique();

        builder.HasMany(s => s.Versions)
            .WithOne(v => v.PlatformSetting)
            .HasForeignKey(v => v.PlatformSettingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
