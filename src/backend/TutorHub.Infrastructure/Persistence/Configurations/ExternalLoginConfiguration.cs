using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class ExternalLoginConfiguration : IEntityTypeConfiguration<ExternalLogin>
{
    public void Configure(EntityTypeBuilder<ExternalLogin> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Provider)
            .IsRequired()
            .HasConversion<int>();

        // Google's `sub` and Facebook's `id` are opaque strings of varying length.
        builder.Property(l => l.ProviderUserId)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(l => l.EmailAtLinkTime)
            .HasMaxLength(320);

        builder.Property(l => l.CreatedAt)
            .IsRequired();

        builder.Property(l => l.LastLoginAt)
            .IsRequired();

        // The single most important constraint in this table: one provider identity
        // may be attached to exactly one account. Without it, a race between two
        // concurrent first-time sign-ins could link the same provider identity to
        // two different users, and the account reached would depend on who won.
        builder.HasIndex(l => new { l.Provider, l.ProviderUserId })
            .IsUnique();

        builder.HasIndex(l => l.UserId);

        builder.HasOne(l => l.User)
            .WithMany(u => u.ExternalLogins)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
