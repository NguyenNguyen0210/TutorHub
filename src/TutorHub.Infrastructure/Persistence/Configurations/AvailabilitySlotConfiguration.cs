using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class AvailabilitySlotConfiguration : IEntityTypeConfiguration<AvailabilitySlot>
{
    public void Configure(EntityTypeBuilder<AvailabilitySlot> builder)
    {
        builder.HasKey(a => a.Id);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_AvailabilitySlot_TimeRange", "\"StartTime\" < \"EndTime\"");
        });

        builder.Property(a => a.DayOfWeek)

            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(a => a.StartTime)
            .IsRequired();

        builder.Property(a => a.EndTime)
            .IsRequired();

        builder.Property(a => a.IsActive)
            .IsRequired();

        builder.HasIndex(a => new { a.TutorProfileId, a.DayOfWeek });

        builder.HasOne(a => a.TutorProfile)
            .WithMany(t => t.AvailabilitySlots)
            .HasForeignKey(a => a.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
