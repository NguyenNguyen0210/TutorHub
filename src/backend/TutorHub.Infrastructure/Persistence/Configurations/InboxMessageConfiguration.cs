using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class InboxMessageConfiguration : IEntityTypeConfiguration<InboxMessage>
{
    public void Configure(EntityTypeBuilder<InboxMessage> builder)
    {
        builder.ToTable("InboxMessages");

        builder.HasKey(i => i.Id);

        builder.HasIndex(i => new { i.ConsumerName, i.EventId })
            .IsUnique()
            .HasDatabaseName("IX_InboxMessages_ConsumerEvent");

        builder.Property(i => i.ConsumerName)
            .IsRequired()
            .HasMaxLength(128);
    }
}
