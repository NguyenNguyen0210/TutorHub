namespace TutorHub.Domain.Entities;

public class TutorSubject
{
    public Guid Id { get; set; }

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    public decimal? OverridePrice { get; set; }

    public bool IsActive { get; set; } = true;
}