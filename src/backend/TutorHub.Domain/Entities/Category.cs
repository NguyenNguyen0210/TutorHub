using TutorHub.Domain.Common;

namespace TutorHub.Domain.Entities;

public class Category : ISoftDeletable
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Soft delete audit properties
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public string? DeleteReason { get; set; }

    // Relationships
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();

    public void SoftDelete(Guid deletedByUserId, string? reason = null)
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedByUserId = deletedByUserId;
        DeleteReason = reason?.Trim();
        IsActive = false;
    }

    public void Restore()
    {
        if (!IsDeleted) return;
        IsDeleted = false;
        DeletedAt = null;
        DeletedByUserId = null;
        DeleteReason = null;
        IsActive = true;
    }
}
