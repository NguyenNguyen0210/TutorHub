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
        // P0 HOTFIX: one booking owns many transactions (payment + payouts +
        // refunds/reversals), so this is 1:N with a plain index — never unique.
        builder.HasOne(t => t.Booking)
            .WithMany(b => b.Transactions)
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        // P0 HOTFIX: one session owns many transactions over its life (payout +
        // refunds/reversals). 1:1 here made EF sever the payout FK when a second
        // transaction for the same session was added. Uniqueness of the single
        // payout is still enforced by the partial unique index below.
        builder.HasOne(t => t.Session)
            .WithMany()
            .HasForeignKey(t => t.SessionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.RelatedTransaction)
            .WithMany()
            .HasForeignKey(t => t.RelatedTransactionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // P0 HOTFIX: plain (non-unique) index — many transactions share one BookingId.
        builder.HasIndex(t => t.BookingId);
        builder.HasIndex(t => t.DisputeId);
        builder.HasIndex(t => t.RelatedTransactionId);

        // Partial unique index: a session can have at most one payout transaction
        builder.HasIndex(t => t.SessionId)
            .IsUnique()
            .HasFilter("\"SessionId\" IS NOT NULL AND \"Type\" = 'SessionPayoutCredit'");

        // F-10: gateway refs are unique per payment attempt (nullable → partial index).
        builder.HasIndex(t => t.PaymentGatewayRef)
            .IsUnique()
            .HasFilter("\"PaymentGatewayRef\" IS NOT NULL");
    }
}
