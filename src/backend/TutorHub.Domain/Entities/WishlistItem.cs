using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class WishlistItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public WishlistItemType ItemType { get; set; }

    public Guid? TutorProfileId { get; set; }
    public TutorProfile? TutorProfile { get; set; }

    public Guid? ServiceId { get; set; }
    public Service? Service { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
