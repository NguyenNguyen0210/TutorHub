namespace TutorHub.Domain.Entities;

public class Subject
{
    public Guid Id { get; set; }

    public string Name { get; set; } = default!;

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;

    public bool IsActive { get; set; } = true;

    // Relationships
    public ICollection<TutorSubject> TutorSubjects { get; set; }
        = new List<TutorSubject>();
}