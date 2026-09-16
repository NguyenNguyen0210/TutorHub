using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Authentication;

/// <summary>
/// P0-D1: server-side pepper used to hash refresh tokens before they are stored.
/// Kept out of the database so a database-only leak cannot be verified offline.
/// </summary>
public class RefreshTokenOptions
{
    public const string SectionName = "RefreshToken";

    [Required(ErrorMessage = "Refresh token hashing pepper is required.")]
    [MinLength(32, ErrorMessage = "Refresh token hashing pepper must be at least 32 characters long.")]
    public string Pepper { get; set; } = default!;
}
