using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class MediaConfiguration : IEntityTypeConfiguration<Media>
{
    public void Configure(EntityTypeBuilder<Media> builder)
    {
        builder.ToTable("Media");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.ObjectKey)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(m => m.OriginalFileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(m => m.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(m => m.StorageProvider)
            .HasConversion<string>()
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.MediaType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(m => m.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(m => m.ObjectKey)
            .IsUnique();

        builder.HasIndex(m => new { m.UploadedByUserId, m.Status });

        builder.HasOne(m => m.UploadedByUser)
            .WithMany(u => u.MediaUploaded)
            .HasForeignKey(m => m.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
