namespace TutorHub.Domain.Entities;

public class Subject
{
    public Guid Id { get; set; }

    public string Name { get; set; } = default!;
    public string Category { get; set; } = default!;

    public bool IsActive { get; set; } = true;

    // Relationships

    public ICollection<TutorSubject> TutorSubjects { get; set; }
        = new List<TutorSubject>();
}