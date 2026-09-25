using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class StudentWithdrawalConfiguration : IEntityTypeConfiguration<StudentWithdrawal>
{
    public void Configure(EntityTypeBuilder<StudentWithdrawal> builder)
    {
        builder.HasKey(w => w.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_StudentWithdrawal_PositiveAmount", "\"Amount\" > 0");
        });

        builder.Property(w => w.Amount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(w => w.BankName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(w => w.BankCode)
            .HasMaxLength(20);

        builder.Property(w => w.AccountNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(w => w.AccountHolderName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(w => w.Note)
            .HasMaxLength(500);

        builder.Property(w => w.RequestedAt)
            .IsRequired();

        builder.Property(w => w.FailureReason)
            .HasMaxLength(500);

        builder.HasIndex(w => new { w.StudentWalletId, w.Status });
        builder.HasIndex(w => w.Status);

        builder.HasOne(w => w.StudentWallet)
            .WithMany(wallet => wallet.Withdrawals)
            .HasForeignKey(w => w.StudentWalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.ProcessingStartedByAdmin)
            .WithMany()
            .HasForeignKey(w => w.ProcessingStartedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.ProcessedByAdmin)
            .WithMany()
            .HasForeignKey(w => w.ProcessedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
