using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class StudentWalletConfiguration : IEntityTypeConfiguration<StudentWallet>
{
    public void Configure(EntityTypeBuilder<StudentWallet> builder)
    {
        builder.HasKey(w => w.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_StudentWallet_NonNegativeBalances", "\"AvailableBalance\" >= 0 AND \"ReservedBalance\" >= 0");
        });

        builder.HasIndex(w => w.StudentProfileId)
            .IsUnique();

        builder.Property(w => w.AvailableBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.ReservedBalance)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(w => w.CreatedAt)
            .IsRequired();

        builder.Property(w => w.UpdatedAt)
            .IsRequired();


        builder.HasOne(w => w.StudentProfile)
            .WithOne(s => s.Wallet)
            .HasForeignKey<StudentWallet>(w => w.StudentProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Transactions)
            .WithOne(t => t.StudentWallet)
            .HasForeignKey(t => t.StudentWalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Withdrawals)
            .WithOne(sw => sw.StudentWallet)
            .HasForeignKey(sw => sw.StudentWalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.TopUpRequests)
            .WithOne(tur => tur.StudentWallet)
            .HasForeignKey(tur => tur.StudentWalletId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
