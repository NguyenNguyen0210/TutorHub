using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.HasKey(wt => wt.Id);

        builder.Property(wt => wt.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(wt => wt.Amount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(wt => wt.BalanceAfter)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(wt => wt.Description)
            .HasMaxLength(500);

        builder.Property(wt => wt.CreatedAt)
            .IsRequired();

        builder.HasIndex(wt => new { wt.WalletId, wt.CreatedAt });
        builder.HasIndex(wt => wt.WithdrawalId);

        builder.HasOne(wt => wt.Wallet)
            .WithMany(w => w.WalletTransactions)
            .HasForeignKey(wt => wt.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.Withdrawal)
            .WithMany()
            .HasForeignKey(wt => wt.WithdrawalId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
