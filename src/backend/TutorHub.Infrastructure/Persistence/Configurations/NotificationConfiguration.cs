using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(n => n.Id);

        // Deduplication invariant (DEC-S7-003, INV-EVENT-004)
        builder.HasIndex(n => new { n.UserId, n.Type, n.DeduplicationKey })
            .IsUnique()
            .HasDatabaseName("IX_Notifications_Dedup");

        // User feed keyset cursor pagination index
        builder.HasIndex(n => new { n.UserId, n.CreatedAt, n.Id })
            .HasDatabaseName("IX_Notifications_UserFeed");

        // Fast unread count query
        builder.HasIndex(n => new { n.UserId, n.IsRead })
            .HasDatabaseName("IX_Notifications_UnreadCount");

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(n => n.Message)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(n => n.Type)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(n => n.DeduplicationKey)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(n => n.DeepLink)
            .HasMaxLength(512);

        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
