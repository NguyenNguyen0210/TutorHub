using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.HasKey(wt => wt.Id);

        builder.Ignore(wt => wt.StudentWalletId);
        builder.Ignore(wt => wt.StudentWallet);

        builder.ToTable("WalletTransactions", table =>
        {
            table.HasCheckConstraint(
                "CK_WalletTransaction_ValidDirection",
                "\"Direction\" IN ('Credit', 'Debit')");
        });

        builder.Property(wt => wt.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(wt => wt.Direction)
            .HasConversion<string>()
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(wt => wt.Amount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(wt => wt.BalanceBefore)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(wt => wt.BalanceAfter)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(wt => wt.ReferenceType)
            .HasMaxLength(100);

        builder.Property(wt => wt.ReferenceId);

        builder.Property(wt => wt.Description)
            .HasMaxLength(500);

        builder.Property(wt => wt.Reason)
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

