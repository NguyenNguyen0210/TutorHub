namespace TutorHub.Domain.Entities;

public class StudentProfile
{
    public Guid Id { get; set; }

    // Identity
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // Domain relationships
    public ICollection<Booking> Bookings { get; set; }
        = new List<Booking>();

}