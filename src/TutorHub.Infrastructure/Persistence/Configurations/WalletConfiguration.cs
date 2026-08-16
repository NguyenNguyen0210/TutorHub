using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(w => w.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Wallet_NonNegativeBalances", "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0");
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
            .HasForeignKey<Wallet>(w => w.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
