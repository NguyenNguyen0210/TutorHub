using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class LearningRecordConfiguration : IEntityTypeConfiguration<LearningRecord>
{
    public void Configure(EntityTypeBuilder<LearningRecord> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Content)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        // One record per session max.
        builder.HasIndex(r => r.SessionId)
            .IsUnique();

        builder.HasOne(r => r.Session)
            .WithMany()
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.TutorProfile)
            .WithMany()
            .HasForeignKey(r => r.TutorProfileId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
