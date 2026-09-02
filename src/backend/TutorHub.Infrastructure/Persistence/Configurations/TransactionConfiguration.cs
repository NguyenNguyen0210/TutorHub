using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.HasIndex(t => t.BookingId)
            .IsUnique();

        builder.Property(t => t.Amount)
            .HasPrecision(10, 2)
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

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        // Foreign keys & Relationships
        builder.HasOne(t => t.Booking)
            .WithOne(b => b.Transaction)
            .HasForeignKey<Transaction>(t => t.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Session)
            .WithOne(s => s.Transaction)
            .HasForeignKey<Transaction>(t => t.SessionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Partial unique index: a session can have at most one payout transaction
        builder.HasIndex(t => t.SessionId)
            .IsUnique()
            .HasFilter("\"SessionId\" IS NOT NULL");
    }
}
