using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class AccountStatusAuditLogConfiguration : IEntityTypeConfiguration<AccountStatusAuditLog>
{
    public void Configure(EntityTypeBuilder<AccountStatusAuditLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PreviousStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.NewStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Reason)
            .HasMaxLength(500);

        builder.Property(x => x.Timestamp)
            .IsRequired();

        builder.HasOne(x => x.TargetUser)
            .WithMany()
            .HasForeignKey(x => x.TargetUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.AdminUser)
            .WithMany()
            .HasForeignKey(x => x.AdminUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
