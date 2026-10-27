using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ConversationAttachmentConfiguration : IEntityTypeConfiguration<ConversationAttachment>
{
    public void Configure(EntityTypeBuilder<ConversationAttachment> builder)
    {
        builder.ToTable("ConversationAttachments");
        builder.HasKey(a => a.StorageKey);
        builder.Property(a => a.StorageKey).HasMaxLength(256);
        builder.Property(a => a.FileName).HasMaxLength(256).IsRequired();
        builder.Property(a => a.ContentType).HasMaxLength(128).IsRequired();
        builder.HasIndex(a => new { a.ConversationId, a.UploadedByUserId });
        builder.HasOne<Conversation>().WithMany().HasForeignKey(a => a.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(a => a.UploadedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
