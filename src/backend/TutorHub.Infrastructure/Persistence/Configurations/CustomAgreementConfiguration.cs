using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class CustomAgreementConfiguration : IEntityTypeConfiguration<CustomAgreement>
{
    public void Configure(EntityTypeBuilder<CustomAgreement> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(a => a.TotalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(a => a.TotalSessions)
            .IsRequired();

        builder.Property(a => a.SessionDurationMinutes)
            .IsRequired();

        builder.Property(a => a.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.ExpiresAt)
            .IsRequired();

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.Property(a => a.RejectionReason)
            .HasMaxLength(500);

        builder.Property(a => a.CancellationReason)
            .HasMaxLength(500);

        // Foreign Key Relationships
        builder.HasOne(a => a.TutorProfile)
            .WithMany()
            .HasForeignKey(a => a.TutorProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.StudentProfile)
            .WithMany()
            .HasForeignKey(a => a.StudentProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Subject)
            .WithMany()
            .HasForeignKey(a => a.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Service)
            .WithMany()
            .HasForeignKey(a => a.ServiceId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Conversation)
            .WithMany()
            .HasForeignKey(a => a.ConversationId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Query Performance Indexes
        builder.HasIndex(a => new { a.TutorProfileId, a.Status });
        builder.HasIndex(a => new { a.StudentProfileId, a.Status });
        builder.HasIndex(a => a.ConversationId);
        builder.HasIndex(a => a.CreatedAt);
    }
}
