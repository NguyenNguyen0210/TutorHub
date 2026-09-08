using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class PlatformSettingVersionConfiguration : IEntityTypeConfiguration<PlatformSettingVersion>
{
    public void Configure(EntityTypeBuilder<PlatformSettingVersion> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Value)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(v => v.Reason)
            .HasMaxLength(500);

        builder.Property(v => v.Version)
            .IsRequired();

        builder.Property(v => v.EffectiveFrom)
            .IsRequired();

        builder.Property(v => v.CreatedAt)
            .IsRequired();

        builder.HasIndex(v => new { v.PlatformSettingId, v.Version })
            .IsUnique();
    }
}
