using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.HasKey(r => r.Id);

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
            .HasMaxLength(1000);

        builder.Property(r => r.Resolution)
            .HasMaxLength(1000);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.HasIndex(r => r.Status);

        builder.HasIndex(r => new { r.BookingId, r.ReporterUserId });

        builder.HasOne(r => r.Booking)
            .WithMany(b => b.Reports)
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ReporterUser)
            .WithMany()
            .HasForeignKey(r => r.ReporterUserId)
            .OnDelete(DeleteBehavior.Restrict);


        builder.HasOne(r => r.ResolvedByAdmin)
            .WithMany()
            .HasForeignKey(r => r.ResolvedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
