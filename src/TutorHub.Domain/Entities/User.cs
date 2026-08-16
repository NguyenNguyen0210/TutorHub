using TutorHub.Domain.Enums;
namespace TutorHub.Domain.Entities;

public class User
{
    public Guid Id { get; set; }

    // Authentication
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;

    // Common profile
    public string FullName { get; set; } = default!;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }

    // Authorization
    public UserRole Role { get; set; }

    // Account status
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    // Profiles
    public TutorProfile? TutorProfile { get; set; }
    public StudentProfile? StudentProfile { get; set; }
}