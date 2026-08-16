using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class AvailabilitySlot
{
    public Guid Id { get; set; }

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public bool IsActive { get; set; } = true;
}