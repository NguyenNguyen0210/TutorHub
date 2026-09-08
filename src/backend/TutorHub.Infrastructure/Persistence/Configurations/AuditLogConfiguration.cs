using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.EntityName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.EntityId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.CorrelationId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45);

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes for audit querying and tracing
        builder.HasIndex(a => new { a.EntityName, a.EntityId });
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.CorrelationId);
        builder.HasIndex(a => a.CreatedAt);
    }
}
