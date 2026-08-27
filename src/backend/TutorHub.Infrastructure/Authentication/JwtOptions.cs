<<<<<<< HEAD
using System.ComponentModel.DataAnnotations;

=======
>>>>>>> 5ec18f8 (refactor(structure): reorganize repository layout into src/backend, src/frontend, and src/test)
namespace TutorHub.Infrastructure.Authentication;

public class JwtOptions
{
    public const string SectionName = "Jwt";

<<<<<<< HEAD
    [Required(ErrorMessage = "JWT Secret key is required.")]
    [MinLength(32, ErrorMessage = "JWT Secret key must be at least 32 characters long.")]
    public string Secret { get; set; } = default!;

    [Required(ErrorMessage = "JWT Issuer is required.")]
    public string Issuer { get; set; } = default!;

    [Required(ErrorMessage = "JWT Audience is required.")]
    public string Audience { get; set; } = default!;

    [Range(1, 1440, ErrorMessage = "Access token expiration must be between 1 and 1440 minutes.")]
    public int AccessTokenExpirationMinutes { get; set; } = 15;

    [Range(1, 365, ErrorMessage = "Refresh token expiration must be between 1 and 365 days.")]
=======
    public string Secret { get; set; } = default!;
    public string Issuer { get; set; } = default!;
    public string Audience { get; set; } = default!;
    public int AccessTokenExpirationMinutes { get; set; } = 15;
>>>>>>> 5ec18f8 (refactor(structure): reorganize repository layout into src/backend, src/frontend, and src/test)
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
