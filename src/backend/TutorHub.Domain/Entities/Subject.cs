namespace TutorHub.Domain.Entities;

public class Subject
{
    public Guid Id { get; set; }

    public string Name { get; set; } = default!;

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;

    public bool IsActive { get; set; } = true;

    // Soft delete columns
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }

    // Relationships
    public ICollection<TutorSubject> TutorSubjects { get; set; }
        = new List<TutorSubject>();

    public void SoftDelete(Guid deletedByUserId)
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedByUserId = deletedByUserId;
        IsActive = false;
    }

    public void Restore()
    {
        if (!IsDeleted) return;
        IsDeleted = false;
        DeletedAt = null;
        DeletedByUserId = null;
        IsActive = true;
    }
}
