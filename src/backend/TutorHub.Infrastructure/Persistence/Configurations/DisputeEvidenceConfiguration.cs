using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class DisputeEvidenceConfiguration : IEntityTypeConfiguration<DisputeEvidence>
{
    public void Configure(EntityTypeBuilder<DisputeEvidence> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.FileName)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(e => e.FileUrl)
            .HasMaxLength(1024)
            .IsRequired();

        builder.Property(e => e.ContentType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.FileSizeBytes)
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.HasOne(e => e.Dispute)
            .WithMany(d => d.Evidences)
            .HasForeignKey(e => e.DisputeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.UploadedByUser)
            .WithMany()
            .HasForeignKey(e => e.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.DisputeId);
    }
}
