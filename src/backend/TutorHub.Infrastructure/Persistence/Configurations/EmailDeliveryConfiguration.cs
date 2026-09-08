using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class EmailDeliveryConfiguration : IEntityTypeConfiguration<EmailDelivery>
{
    public void Configure(EntityTypeBuilder<EmailDelivery> builder)
    {
        builder.ToTable("EmailDeliveries");

        builder.HasKey(e => e.Id);

        builder.HasIndex(e => e.NotificationId)
            .IsUnique()
            .HasDatabaseName("IX_EmailDeliveries_Notification");

        builder.HasIndex(e => new { e.Status, e.NextAttemptAt, e.LockedUntil })
            .HasDatabaseName("IX_EmailDeliveries_Dispatch");

        builder.Property(e => e.ToEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(e => e.Subject)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(e => e.Body)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(e => e.LockedBy)
            .HasMaxLength(128);

        builder.Property(e => e.ProviderMessageId)
            .HasMaxLength(128);

        builder.HasOne(e => e.Notification)
            .WithOne()
            .HasForeignKey<EmailDelivery>(e => e.NotificationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
