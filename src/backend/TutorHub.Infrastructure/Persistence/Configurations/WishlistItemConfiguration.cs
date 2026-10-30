using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("wishlist_items", t =>
        {
            t.HasCheckConstraint(
                "CK_wishlist_items_type_target",
                "(\"ItemType\" = 1 AND \"TutorProfileId\" IS NOT NULL AND \"ServiceId\" IS NULL) OR (\"ItemType\" = 2 AND \"ServiceId\" IS NOT NULL AND \"TutorProfileId\" IS NULL)");
        });

        builder.HasKey(w => w.Id);

        builder.Property(w => w.ItemType)
            .IsRequired();

        builder.Property(w => w.CreatedAt)
            .IsRequired();

        builder.HasOne(w => w.User)
            .WithMany(u => u.WishlistItems)
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.TutorProfile)
            .WithMany(t => t.WishlistItems)
            .HasForeignKey(w => w.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.Service)
            .WithMany(s => s.WishlistItems)
            .HasForeignKey(w => w.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => new { w.UserId, w.TutorProfileId })
            .IsUnique()
            .HasFilter("\"TutorProfileId\" IS NOT NULL");

        builder.HasIndex(w => new { w.UserId, w.ServiceId })
            .IsUnique()
            .HasFilter("\"ServiceId\" IS NOT NULL");
    }
}
