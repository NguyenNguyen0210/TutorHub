using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.HasKey(s => s.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Session_Schedule", "\"StartAt\" IS NULL OR \"EndAt\" IS NULL OR \"StartAt\" < \"EndAt\"");
        });

        builder.Property(s => s.SessionNumber)
            .IsRequired();

        builder.Property(s => s.EarningAmount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.IsPayoutReleased)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // Foreign Key
        builder.HasOne(s => s.Enrollment)
            .WithMany(e => e.Sessions)
            .HasForeignKey(s => s.EnrollmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(s => new { s.EnrollmentId, s.SessionNumber })
            .IsUnique();

        builder.HasIndex(s => new { s.Status, s.StartAt });
    }
}
