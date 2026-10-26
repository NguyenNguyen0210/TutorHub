using TutorHub.Domain.Common;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Service : ISoftDeletable
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
    public string? ShortDescription { get; set; }
    public string? TagsJson { get; set; }
    public string? LearningScope { get; set; }
    public string? ExpectedOutcome { get; set; }

    // Package specification
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public decimal Price { get; set; }
    public TeachingMode TeachingMode { get; set; }

    // Trial Lesson & Media preview
    public string? TrialLessonUrl { get; set; }
    public string? CoverImageUrl { get; set; }

    // Extended Course Details (JSONB-backed)
    public string? CurriculumJson { get; set; }
    public string? TargetAudienceJson { get; set; }
    public string? PrerequisitesJson { get; set; }
    public string? FaqsJson { get; set; }

    // Lifecycle
    public ServiceStatus Status { get; set; } = ServiceStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Soft delete audit properties
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public string? DeleteReason { get; set; }

    // Domain state transitions (state machine only — authorization is in Application layer)
    public void Publish()
    {
        if (Status == ServiceStatus.Published)
        {
            throw new InvalidOperationException("Service is already published.");
        }

        if (Status == ServiceStatus.Paused)
        {
            throw new InvalidOperationException("A paused service must be resumed, not republished.");
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

    public void Pause()
    {
        if (Status != ServiceStatus.Published)
        {
            throw new InvalidOperationException($"Only a published service can be paused. Current status: {Status}.");
        }

        Status = ServiceStatus.Paused;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Resume()
    {
        if (Status != ServiceStatus.Paused)
        {
            throw new InvalidOperationException($"Only a paused service can be resumed. Current status: {Status}.");
        }

        Status = ServiceStatus.Published;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SoftDelete(Guid deletedByUserId, string? reason = null)
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedByUserId = deletedByUserId;
        DeleteReason = reason?.Trim();
        Status = ServiceStatus.Unpublished;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        if (!IsDeleted) return;
        IsDeleted = false;
        DeletedAt = null;
        DeletedByUserId = null;
        DeleteReason = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
