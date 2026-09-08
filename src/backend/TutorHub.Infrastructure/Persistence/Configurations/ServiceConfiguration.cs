using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => new { s.TutorProfileId, s.Status });
        builder.HasIndex(s => new { s.SubjectId, s.Status });

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Description)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(s => s.LearningScope)
            .HasMaxLength(2000);

        builder.Property(s => s.ExpectedOutcome)
            .HasMaxLength(2000);

        builder.Property(s => s.TotalSessions)
            .IsRequired();

        builder.Property(s => s.SessionDurationMinutes)
            .IsRequired();

        builder.Property(s => s.Price)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(s => s.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.TrialLessonUrl)
            .HasMaxLength(1000);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // Foreign keys
        builder.HasOne(s => s.TutorProfile)
            .WithMany(t => t.Services)
            .HasForeignKey(s => s.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Subject)
            .WithMany()
            .HasForeignKey(s => s.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
