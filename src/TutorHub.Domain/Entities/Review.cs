namespace TutorHub.Domain.Entities;

public class Review
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    public Guid ReviewerUserId { get; set; }
    public User ReviewerUser { get; set; } = default!;

    public Guid RevieweeUserId { get; set; }
    public User RevieweeUser { get; set; } = default!;

    public int Rating { get; set; }

    public string? Comment { get; set; }

    // Student → Tutor is public.
    // Tutor → Student is admin-only.
    public bool IsPublic { get; set; }

    public DateTime CreatedAt { get; set; }
}