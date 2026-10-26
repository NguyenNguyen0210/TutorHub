using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Ignore(w => w.Transactions);

        builder.ToTable("Wallets", t =>
        {
            t.HasCheckConstraint("CK_Wallet_NonNegativeBalances", "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0 AND \"WithdrawingBalance\" >= 0");
        });

        builder.HasIndex(w => w.UserId)
            .IsUnique();

        builder.HasIndex(w => w.TutorProfileId);
        builder.HasIndex(w => w.StudentProfileId);

        builder.Property(w => w.PendingBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.AvailableBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.WithdrawingBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.CreatedAt)
            .IsRequired();

        builder.Property(w => w.UpdatedAt)
            .IsRequired();

        builder.HasOne(w => w.User)
            .WithOne(u => u.Wallet)
            .HasForeignKey<Wallet>(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.TutorProfile)
            .WithMany()
            .HasForeignKey(w => w.TutorProfileId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(w => w.StudentProfile)
            .WithMany()
            .HasForeignKey(w => w.StudentProfileId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(w => w.WalletTransactions)
            .WithOne(wt => wt.Wallet)
            .HasForeignKey(wt => wt.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Withdrawals)
            .WithOne(wd => wd.Wallet)
            .HasForeignKey(wd => wd.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.TopUpRequests)
            .WithOne(tur => tur.Wallet)
            .HasForeignKey(tur => tur.WalletId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
