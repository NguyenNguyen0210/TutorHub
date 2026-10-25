using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
    {
        builder.ToTable("IdempotencyRecords");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Key)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(r => r.UserId);

        builder.Property(r => r.Endpoint)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(r => r.RequestHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(r => r.ResponseStatusCode);

        builder.Property(r => r.ResponseContentType)
            .HasMaxLength(128);

        builder.Property(r => r.ResponseBody)
            .HasColumnType("text");

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.Property(r => r.ExpiresAt)
            .IsRequired();

        builder.HasIndex(r => new { r.Key, r.UserId })
            .IsUnique()
            .HasDatabaseName("IX_IdempotencyRecords_Key_UserId");

        builder.HasIndex(r => r.ExpiresAt)
            .HasDatabaseName("IX_IdempotencyRecords_ExpiresAt");
    }
}
