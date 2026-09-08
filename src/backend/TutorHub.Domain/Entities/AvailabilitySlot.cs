using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class AvailabilitySlot
{
    public Guid Id { get; set; }

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }

    public bool IsActive { get; private set; } = true;

    // F-23: guarded transitions (End > Start mirrors the DB check constraint).

    public static AvailabilitySlot Create(Guid tutorProfileId, DayOfWeek dayOfWeek, TimeOnly startTime, TimeOnly endTime)
    {
        if (tutorProfileId == Guid.Empty)
            throw new ArgumentException("Tutor profile is required.", nameof(tutorProfileId));
        if (startTime >= endTime)
            throw new ArgumentException("End time must be after start time.", nameof(endTime));

        return new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfileId,
            DayOfWeek = dayOfWeek,
            StartTime = startTime,
            EndTime = endTime,
            IsActive = true
        };
    }

    public void Reschedule(TimeOnly startTime, TimeOnly endTime)
    {
        if (startTime >= endTime)
            throw new ArgumentException("End time must be after start time.", nameof(endTime));

        StartTime = startTime;
        EndTime = endTime;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}