using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class TutorSubjectConfiguration : IEntityTypeConfiguration<TutorSubject>
{
    public void Configure(EntityTypeBuilder<TutorSubject> builder)
    {
        builder.HasKey(ts => ts.Id);

        builder.HasIndex(ts => new { ts.TutorProfileId, ts.SubjectId })
            .IsUnique();

        builder.Property(ts => ts.IsActive)
            .IsRequired();

        builder.HasOne(ts => ts.TutorProfile)
            .WithMany(t => t.TutorSubjects)
            .HasForeignKey(ts => ts.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ts => ts.Subject)
            .WithMany(s => s.TutorSubjects)
            .HasForeignKey(ts => ts.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
