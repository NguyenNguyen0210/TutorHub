using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Service
{
    public Guid Id { get; set; }

    // Relationships
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    // Content & Scope
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string? LearningScope { get; set; }
    public string? ExpectedOutcome { get; set; }

    // Package specification
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public decimal Price { get; set; }
    public TeachingMode TeachingMode { get; set; }

    // Trial Lesson (optional external URL reference)
    public string? TrialLessonUrl { get; set; }

    // Lifecycle
    public ServiceStatus Status { get; set; } = ServiceStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Domain state transitions (state machine only — authorization is in Application layer)
    public void Publish()
    {
        if (Status == ServiceStatus.Published)
        {
            throw new InvalidOperationException("Service is already published.");
        }

        Status = ServiceStatus.Published;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Unpublish()
    {
        if (Status == ServiceStatus.Draft)
        {
            throw new InvalidOperationException("Draft service cannot be unpublished.");
        }

        if (Status == ServiceStatus.Unpublished)
        {
            throw new InvalidOperationException("Service is already unpublished.");
        }

        Status = ServiceStatus.Unpublished;
        UpdatedAt = DateTime.UtcNow;
    }
}
