using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");

        builder.HasKey(m => m.Id);

        // Fast retrieval and keyset cursor pagination
        builder.HasIndex(m => new { m.ConversationId, m.CreatedAt, m.Id })
            .HasDatabaseName("IX_Messages_ConversationFeed");

        builder.Property(m => m.Content)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(m => m.AttachmentKey)
            .HasMaxLength(256);

        builder.Property(m => m.AttachmentName)
            .HasMaxLength(256);

        builder.Property(m => m.AttachmentContentType)
            .HasMaxLength(128);

        builder.HasOne(m => m.SenderUser)
            .WithMany()
            .HasForeignKey(m => m.SenderUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
