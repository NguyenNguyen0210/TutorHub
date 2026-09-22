using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TutorWalletConfiguration : IEntityTypeConfiguration<TutorWallet>
{
    public void Configure(EntityTypeBuilder<TutorWallet> builder)
    {
        builder.HasKey(w => w.Id);

        builder.ToTable("Wallets", t =>
        {
            t.HasCheckConstraint("CK_Wallet_NonNegativeBalances", "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0 AND \"HeldBalance\" >= 0 AND \"HeldBalance\" <= \"AvailableBalance\"");
        });

        builder.HasIndex(w => w.TutorProfileId)
            .IsUnique();

        builder.Property(w => w.PendingBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.AvailableBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.UpdatedAt)
            .IsRequired();

        builder.HasOne(w => w.TutorProfile)
            .WithOne(t => t.Wallet)
            .HasForeignKey<TutorWallet>(w => w.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
