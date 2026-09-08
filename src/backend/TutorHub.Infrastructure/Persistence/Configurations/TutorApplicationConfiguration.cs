using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TutorApplicationConfiguration : IEntityTypeConfiguration<TutorApplication>
{
    public void Configure(EntityTypeBuilder<TutorApplication> builder)
    {
        builder.HasKey(a => a.Id);

        // One User -> many TutorApplications
        builder.HasOne(a => a.User)
            .WithMany(u => u.TutorApplications)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Admin reviewer (nullable)
        builder.HasOne(a => a.ReviewedByAdmin)
            .WithMany()
            .HasForeignKey(a => a.ReviewedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        // Status stored as string
        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(a => a.Status);

        builder.HasIndex(a => new { a.UserId, a.Status });

        builder.Property(a => a.Bio)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(a => a.Education)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(a => a.ExperienceYears)
            .IsRequired();

        builder.Property(a => a.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.Address)
            .HasMaxLength(500);

        builder.Property(a => a.RejectionReason)
            .HasMaxLength(500);

        builder.Property(a => a.SubmittedAt)
            .IsRequired();
    }
}
