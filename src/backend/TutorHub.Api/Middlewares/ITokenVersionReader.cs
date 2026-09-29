namespace TutorHub.Api.Middlewares;

/// <summary>
/// Reads the authoritative per-user token version from the database.
/// Narrow seam (instead of <c>IAppDbContext</c> directly) so the revocation
/// middleware is unit-testable without Entity Framework.
/// </summary>
public interface ITokenVersionReader
{
    /// <summary>
    /// Returns the current version, or <c>null</c> when the user no longer exists.
    /// </summary>
    Task<int?> GetTokenVersionAsync(Guid userId, CancellationToken cancellationToken = default);
}
