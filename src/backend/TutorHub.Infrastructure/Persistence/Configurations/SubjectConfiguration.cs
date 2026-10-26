using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        // PostgreSQL Partial Unique Index: unique only among non-deleted records within a category
        builder.HasIndex(s => new { s.Name, s.CategoryId })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.Property(s => s.IsActive)
            .IsRequired();

        // Soft Delete configuration & Global Query Filter
        builder.Property(s => s.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(s => s.IsDeleted);

        builder.HasQueryFilter(s => !s.IsDeleted);

        builder.HasOne(s => s.Category)
            .WithMany(c => c.Subjects)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
