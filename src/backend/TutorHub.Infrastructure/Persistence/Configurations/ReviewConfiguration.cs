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

        builder.Property(r => r.IsPublic)
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.HasIndex(r => new { r.BookingId, r.ReviewerUserId })
            .IsUnique();

        builder.HasIndex(r => r.RevieweeUserId);

        builder.HasOne(r => r.Booking)
            .WithMany(b => b.Reviews)
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ReviewerUser)
            .WithMany()
            .HasForeignKey(r => r.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);


        builder.HasOne(r => r.RevieweeUser)
            .WithMany()
            .HasForeignKey(r => r.RevieweeUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
