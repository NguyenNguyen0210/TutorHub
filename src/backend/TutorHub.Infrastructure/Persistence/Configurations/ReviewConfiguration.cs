using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Review_RatingRange", "\"Rating\" >= 1 AND \"Rating\" <= 5");
        });

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(2000);

        builder.Property(r => r.TutorReply)
            .HasMaxLength(2000);

        builder.Property(r => r.IsRemoved)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(r => r.RemovalReason)
            .HasMaxLength(500);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        // 1 Review per Enrollment (Single Source of Truth)
        builder.HasIndex(r => r.EnrollmentId)
            .IsUnique();

        builder.HasIndex(r => r.IsRemoved);

        builder.HasOne(r => r.Enrollment)
            .WithOne(e => e.Review)
            .HasForeignKey<Review>(r => r.EnrollmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.RemovedByAdmin)
            .WithMany()
            .HasForeignKey(r => r.RemovedByAdminId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
