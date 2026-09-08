using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class SessionRescheduleRequestConfiguration : IEntityTypeConfiguration<SessionRescheduleRequest>
{
    public void Configure(EntityTypeBuilder<SessionRescheduleRequest> builder)
    {
        builder.HasKey(r => r.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_SessionRescheduleRequest_Schedule", "\"ProposedStartAt\" < \"ProposedEndAt\"");
        });

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.Reason)
            .HasMaxLength(500);

        builder.Property(r => r.RejectionReason)
            .HasMaxLength(500);

        builder.Property(r => r.ProposedStartAt)
            .IsRequired();

        builder.Property(r => r.ProposedEndAt)
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        // Foreign keys & Relationships
        builder.HasOne(r => r.Session)
            .WithMany(s => s.RescheduleRequests)
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.ProposerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.RecipientUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Partial unique index: at most ONE Pending request per session (INV-RESCHED-004)
        builder.HasIndex(r => r.SessionId)
            .IsUnique()
            .HasFilter("\"Status\" = 'Pending'");

        builder.HasIndex(r => new { r.SessionId, r.CreatedAt });
    }
}
