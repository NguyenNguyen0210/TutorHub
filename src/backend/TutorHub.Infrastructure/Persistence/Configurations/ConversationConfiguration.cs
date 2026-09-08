using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.ToTable("Conversations");

        builder.HasKey(c => c.Id);

        // 1-to-1 unique conversation between Student and Tutor canonical pair
        builder.HasIndex(c => new { c.StudentProfileId, c.TutorProfileId })
            .IsUnique()
            .HasDatabaseName("IX_Conversations_Participants");

        // Fast retrieval & cursor pagination by role
        builder.HasIndex(c => new { c.StudentProfileId, c.LastMessageAt, c.Id })
            .HasDatabaseName("IX_Conversations_Student");

        builder.HasIndex(c => new { c.TutorProfileId, c.LastMessageAt, c.Id })
            .HasDatabaseName("IX_Conversations_Tutor");

        builder.Property(c => c.LastMessagePreview)
            .HasMaxLength(256);

        builder.HasOne(c => c.StudentProfile)
            .WithMany()
            .HasForeignKey(c => c.StudentProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.TutorProfile)
            .WithMany()
            .HasForeignKey(c => c.TutorProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
