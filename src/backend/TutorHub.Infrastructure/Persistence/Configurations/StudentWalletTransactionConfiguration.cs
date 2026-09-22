using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class StudentWalletTransactionConfiguration : IEntityTypeConfiguration<StudentWalletTransaction>
{
    public void Configure(EntityTypeBuilder<StudentWalletTransaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.Direction)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.Amount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(t => t.BalanceBefore)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(t => t.BalanceAfter)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(t => t.ReferenceType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(500);

        builder.Property(t => t.Reason)
            .HasMaxLength(500);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        builder.HasIndex(t => new { t.StudentWalletId, t.CreatedAt });
        builder.HasIndex(t => new { t.ReferenceType, t.ReferenceId });

        builder.HasOne(t => t.StudentWallet)
            .WithMany(w => w.Transactions)
            .HasForeignKey(t => t.StudentWalletId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
