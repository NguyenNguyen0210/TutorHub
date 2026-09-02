using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Booking_TimeRange", "\"StartAt\" < \"EndAt\"");
            t.HasCheckConstraint("CK_Booking_Price", "\"HourlyRate\" >= 0 AND \"TotalAmount\" >= 0");
        });

        builder.Property(b => b.StartAt)

            .IsRequired();

        builder.Property(b => b.EndAt)
            .IsRequired();

        builder.Property(b => b.HourlyRate)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(b => b.TotalAmount)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(b => b.CancelledBy)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(b => b.CancellationReason)
            .HasMaxLength(500);

        builder.Property(b => b.CreatedAt)
            .IsRequired();

        // Snapshot fields (Sprint 4)
        builder.Property(b => b.TotalPrice)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(b => b.TotalSessions)
            .IsRequired();

        builder.Property(b => b.SessionDurationMinutes)
            .IsRequired();

        builder.Property(b => b.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        // Indexes
        builder.HasIndex(b => new { b.TutorProfileId, b.StartAt, b.EndAt, b.Status });
        builder.HasIndex(b => new { b.StudentProfileId, b.Status });
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => b.ServiceId);

        // Relationships
        builder.HasOne(b => b.StudentProfile)
            .WithMany(s => s.Bookings)
            .HasForeignKey(b => b.StudentProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.TutorProfile)
            .WithMany()
            .HasForeignKey(b => b.TutorProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Subject)
            .WithMany()
            .HasForeignKey(b => b.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Service)
            .WithMany()
            .HasForeignKey(b => b.ServiceId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
