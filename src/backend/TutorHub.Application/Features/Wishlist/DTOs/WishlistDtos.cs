namespace TutorHub.Application.Features.Wishlist.DTOs;

public record WishlistToggleResultDto(bool IsFavorited, string Message);

public record WishlistIdsDto(IReadOnlyList<Guid> TutorIds, IReadOnlyList<Guid> ServiceIds);

public class WishlistTutorDto
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public string FullName { get; set; } = default!;
    public string? AvatarUrl { get; set; }
    public string Bio { get; set; } = default!;
    public string Education { get; set; } = default!;
    public int ExperienceYears { get; set; }
    public decimal RatingAvg { get; set; }
    public int TotalReviews { get; set; }
    public bool IsVerified { get; set; }
    public decimal MinPrice { get; set; }
    public List<string> Subjects { get; set; } = new();
    public DateTime FavoritedAt { get; set; }
}

public class WishlistServiceDto
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public Guid TutorProfileId { get; set; }
    public string TutorName { get; set; } = default!;
    public string? TutorAvatar { get; set; }
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public string? CoverImageUrl { get; set; }
    public string SubjectName { get; set; } = default!;
    public DateTime FavoritedAt { get; set; }
}
