using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");

        builder.HasKey(o => o.Id);

        builder.HasIndex(o => o.EventId)
            .IsUnique()
            .HasDatabaseName("IX_OutboxMessages_EventId");

        builder.HasIndex(o => new { o.Status, o.NextAttemptAt, o.LockedUntil })
            .HasDatabaseName("IX_OutboxMessages_Dispatch");

        builder.Property(o => o.EventType)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(o => o.AggregateType)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(o => o.Payload)
            .IsRequired();

        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(o => o.LockedBy)
            .HasMaxLength(128);
    }
}
