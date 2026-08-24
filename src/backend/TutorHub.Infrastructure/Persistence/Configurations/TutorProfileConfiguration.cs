using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TutorProfileConfiguration : IEntityTypeConfiguration<TutorProfile>
{
    public void Configure(EntityTypeBuilder<TutorProfile> builder)
    {
        builder.HasKey(t => t.Id);

        builder.HasIndex(t => t.UserId)
            .IsUnique();

        builder.HasIndex(t => t.Status);

        builder.Property(t => t.Bio)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(t => t.Education)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(t => t.HourlyRate)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(t => t.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.Address)
            .HasMaxLength(500);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.RejectionReason)
            .HasMaxLength(500);

        builder.Property(t => t.RatingAvg)
            .HasPrecision(3, 2)
            .IsRequired();

        builder.Property(t => t.TotalReviews)
            .IsRequired();

        builder.HasOne(t => t.User)
            .WithOne(u => u.TutorProfile)
            .HasForeignKey<TutorProfile>(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.ReviewedByAdmin)
            .WithMany()
            .HasForeignKey(t => t.ReviewedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
