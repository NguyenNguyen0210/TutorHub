using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Amount)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(t => t.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.CommissionRate)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(t => t.CommissionAmount)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(t => t.PayoutAmount)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(t => t.PaymentGatewayRef)
            .HasMaxLength(256);

        builder.Property(t => t.Description)
            .HasMaxLength(500);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        // Foreign keys & Relationships
        builder.HasOne(t => t.Booking)
            .WithMany()
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Session)
            .WithOne(s => s.Transaction)
            .HasForeignKey<Transaction>(t => t.SessionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.RelatedTransaction)
            .WithMany()
            .HasForeignKey(t => t.RelatedTransactionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.BookingId);
        builder.HasIndex(t => t.DisputeId);
        builder.HasIndex(t => t.RelatedTransactionId);

        // Partial unique index: a session can have at most one payout transaction
        builder.HasIndex(t => t.SessionId)
            .IsUnique()
            .HasFilter("\"SessionId\" IS NOT NULL AND \"Type\" = 'SessionPayoutCredit'");
    }
}
