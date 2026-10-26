using System.ComponentModel.DataAnnotations.Schema;

namespace TutorHub.Domain.Entities;

public class StudentProfile
{
    public Guid Id { get; set; }

    // Identity
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // Domain relationships
    [NotMapped]
    public Wallet? Wallet => User?.Wallet;

    public ICollection<Booking> Bookings { get; set; }
        = new List<Booking>();
}
