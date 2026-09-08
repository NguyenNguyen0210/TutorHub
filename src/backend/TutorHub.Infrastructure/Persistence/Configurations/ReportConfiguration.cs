using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReportType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.TargetId)
            .HasMaxLength(200);

        builder.Property(r => r.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(r => r.EvidenceUrl)
            .HasMaxLength(500);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.AdminDecision)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(r => r.Resolution)
            .HasMaxLength(1000);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        // Foreign keys
        builder.Property(r => r.BookingId)
            .IsRequired(false);

        builder.HasOne(r => r.Booking)
            .WithMany(b => b.Reports)
            .HasForeignKey(r => r.BookingId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(r => r.ReportedUserId)
            .IsRequired(false);

        builder.HasOne(r => r.ReportedUser)
            .WithMany()
            .HasForeignKey(r => r.ReportedUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(r => r.ReporterUser)
            .WithMany()
            .HasForeignKey(r => r.ReporterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ResolvedByAdmin)
            .WithMany()
            .HasForeignKey(r => r.ResolvedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        // Moderation querying indexes
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.ReportType);
        builder.HasIndex(r => r.ReportedUserId);
        builder.HasIndex(r => r.ReporterUserId);
        builder.HasIndex(r => r.CreatedAt);
    }
}
