using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TopUpRequestConfiguration : IEntityTypeConfiguration<TopUpRequest>
{
    public void Configure(EntityTypeBuilder<TopUpRequest> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Ignore(r => r.StudentWalletId);
        builder.Ignore(r => r.StudentWallet);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_TopUpRequest_PositiveAmount", "\"Amount\" > 0");
        });

        builder.Property(r => r.Amount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(r => r.TransferReference)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(r => r.TransferReference)
            .IsUnique();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.RequestedAt)
            .IsRequired();

        builder.Property(r => r.RejectionReason)
            .HasMaxLength(500);

        builder.Property(r => r.AdminNote)
            .HasMaxLength(500);

        builder.HasIndex(r => new { r.WalletId, r.Status });
        builder.HasIndex(r => r.Status);

        builder.HasOne(r => r.Wallet)
            .WithMany(w => w.TopUpRequests)
            .HasForeignKey(r => r.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ProcessedByAdmin)
            .WithMany()
            .HasForeignKey(r => r.ProcessedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
