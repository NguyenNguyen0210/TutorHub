using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class DisputeResponseConfiguration : IEntityTypeConfiguration<DisputeResponse>
{
    public void Configure(EntityTypeBuilder<DisputeResponse> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Content).HasMaxLength(10000).IsRequired();
        builder.HasOne(x => x.Dispute).WithMany(x => x.Responses).HasForeignKey(x => x.DisputeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.AuthorUser).WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.DisputeId, x.CreatedAt });
    }
}
