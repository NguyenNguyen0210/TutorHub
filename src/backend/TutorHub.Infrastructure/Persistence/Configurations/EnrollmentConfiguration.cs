using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.HasKey(e => e.Id);

        // Snapshot terms & properties
        builder.Property(e => e.TotalPrice)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(e => e.TotalSessions)
            .IsRequired();

        builder.Property(e => e.CompletedSessions)
            .IsRequired();

        builder.Property(e => e.SessionDurationMinutes)
            .IsRequired();

        builder.Property(e => e.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.CancelledBy)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.CancellationReason)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        // Foreign keys & Relationships
        builder.HasOne(e => e.Booking)
            .WithOne(b => b.Enrollment)
            .HasForeignKey<Enrollment>(e => e.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.StudentProfile)
            .WithMany()
            .HasForeignKey(e => e.StudentProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.TutorProfile)
            .WithMany()
            .HasForeignKey(e => e.TutorProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Service)
            .WithMany()
            .HasForeignKey(e => e.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Subject)
            .WithMany()
            .HasForeignKey(e => e.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.BookingId)
            .IsUnique();

        builder.HasIndex(e => new { e.StudentProfileId, e.Status });
        builder.HasIndex(e => new { e.TutorProfileId, e.Status });
        builder.HasIndex(e => e.Status);
    }
}
