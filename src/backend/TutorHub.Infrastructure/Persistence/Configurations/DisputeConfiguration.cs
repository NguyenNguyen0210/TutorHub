using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Reason)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(d => d.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.ResolutionDecision)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(d => d.ResolutionSource)
            .HasMaxLength(100);

        builder.Property(d => d.AdminNotes)
            .HasMaxLength(2000);

        builder.Property(d => d.HeldAmount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(d => d.HoldType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.HoldStatus)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.CreatedAt)
            .IsRequired();

        // Foreign keys & Relationships
        builder.HasOne(d => d.Session)
            .WithMany()
            .HasForeignKey(d => d.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.InitiatorUser)
            .WithMany()
            .HasForeignKey(d => d.InitiatorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.RespondentUser)
            .WithMany()
            .HasForeignKey(d => d.RespondentUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.Evidences)
            .WithOne(e => e.Dispute)
            .HasForeignKey(e => e.DisputeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Optimistic concurrency token (xmin in PostgreSQL)
        builder.Property<uint>("xmin")
            .HasColumnType("xid")
            .ValueGeneratedOnAddOrUpdate()
            .IsRowVersion();

        // Indexes
        builder.HasIndex(d => d.SessionId);
        builder.HasIndex(d => d.InitiatorUserId);
        builder.HasIndex(d => d.RespondentUserId);
        builder.HasIndex(d => d.Status);

        // At most one ACTIVE (non-terminal) dispute per session (INV-DISP-001).
        // A plain (non-unique) SessionId index is kept above for lookups; this
        // filtered unique index additionally prevents concurrent duplicate filing.
        builder.HasIndex(d => d.SessionId)
            .HasDatabaseName("IX_Disputes_ActiveSessionId")
            .IsUnique()
            .HasFilter("\"Status\" IN ('Open', 'UnderReview', 'RequiresAdminFinancialIntervention', 'RequiresAdminRefundSettlement')");

        // Filtered unique index: Single terminal financial dispute resolution per original earning (DEC-S8-033, INV-DISP-009)
        builder.HasIndex(d => d.OriginalTransactionId)
            .HasFilter("\"AffectsFinancialResolution\" = TRUE")
            .IsUnique();
    }
}
