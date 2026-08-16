using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Report
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    public Guid ReporterUserId { get; set; }
    public User ReporterUser { get; set; } = default!;

    public string Description { get; set; } = default!;

    public string? EvidenceUrl { get; set; }

    public ReportStatus Status { get; set; }

    public string? AdminDecision { get; set; }
    public string? Resolution { get; set; }

    public Guid? ResolvedByAdminId { get; set; }
    public User? ResolvedByAdmin { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}