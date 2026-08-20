namespace TutorHub.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Relationships
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}
