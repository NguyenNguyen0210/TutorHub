using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.HasOne(s => s.User)
            .WithOne(u => u.StudentProfile)
            .HasForeignKey<StudentProfile>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
