using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Report
{
    public Guid Id { get; set; }

    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public Guid? ReportedUserId { get; set; }
    public User? ReportedUser { get; set; }

    public TrustReportType ReportType { get; set; } = TrustReportType.General;
    public string? TargetId { get; set; }

    public Guid ReporterUserId { get; set; }
    public User ReporterUser { get; set; } = default!;

    public string Description { get; set; } = default!;

    public string? EvidenceUrl { get; set; }

    public ReportStatus Status { get; set; }

    public ReportDecision? AdminDecision { get; set; }
    public string? Resolution { get; set; }

    public Guid? ResolvedByAdminId { get; private set; }
    public User? ResolvedByAdmin { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; private set; }

    // F-23: lifecycle transitions live here, not scattered in handlers.

    public static Report Create(
        Guid reporterUserId,
        TrustReportType reportType,
        string description,
        Guid? bookingId = null,
        Guid? reportedUserId = null,
        string? targetId = null,
        string? evidenceUrl = null,
        DateTime? now = null)
    {
        if (reporterUserId == Guid.Empty)
            throw new ArgumentException("Reporter user is required.", nameof(reporterUserId));
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required.", nameof(description));

        var trimmed = description.Trim();
        if (trimmed.Length > 2000)
            throw new ArgumentException("Description cannot exceed 2000 characters.", nameof(description));

        return new Report
        {
            Id = Guid.NewGuid(),
            ReporterUserId = reporterUserId,
            ReportType = reportType,
            Description = trimmed,
            BookingId = bookingId,
            ReportedUserId = reportedUserId,
            TargetId = targetId,
            EvidenceUrl = evidenceUrl,
            Status = ReportStatus.Open,
            CreatedAt = now ?? DateTime.UtcNow
        };
    }

    public void Resolve(ReportDecision decision, string resolution, Guid adminId, DateTime? now = null)
    {
        if (Status != ReportStatus.Open)
            throw new InvalidOperationException("Only open reports can be resolved.");
        if (string.IsNullOrWhiteSpace(resolution))
            throw new ArgumentException("Resolution is required.", nameof(resolution));

        Status = ReportStatus.Resolved;
        AdminDecision = decision;
        Resolution = resolution.Trim();
        ResolvedByAdminId = adminId;
        ResolvedAt = now ?? DateTime.UtcNow;
    }
}