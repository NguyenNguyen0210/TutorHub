using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TutorProfileConfiguration : IEntityTypeConfiguration<TutorProfile>
{
    public void Configure(EntityTypeBuilder<TutorProfile> builder)
    {
        builder.HasKey(t => t.Id);

        builder.HasIndex(t => t.UserId)
            .IsUnique();

        builder.Property(t => t.Bio)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(t => t.Education)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(t => t.ExperienceYears)
            .IsRequired();

        builder.Property(t => t.TeachingMode)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.Address)
            .HasMaxLength(500);

        builder.Property(t => t.RatingAvg)
            .HasPrecision(3, 2)
            .IsRequired();

        builder.Property(t => t.TotalReviews)
            .IsRequired();

        builder.Property(t => t.BankName)
            .HasMaxLength(100);

        builder.Property(t => t.BankCode)
            .HasMaxLength(20);

        builder.Property(t => t.AccountNumber)
            .HasMaxLength(50);

        builder.Property(t => t.AccountHolderName)
            .HasMaxLength(150);

        builder.HasOne(t => t.User)
            .WithOne(u => u.TutorProfile)
            .HasForeignKey<TutorProfile>(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
