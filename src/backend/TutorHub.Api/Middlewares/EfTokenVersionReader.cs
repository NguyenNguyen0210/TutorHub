using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Api.Middlewares;

/// <summary>
/// Production <see cref="ITokenVersionReader"/> over Entity Framework.
/// No-tracking single-column lookup: one cheap indexed read per cache miss.
/// </summary>
public sealed class EfTokenVersionReader : ITokenVersionReader
{
    private readonly IAppDbContext _db;

    public EfTokenVersionReader(IAppDbContext db)
    {
        _db = db;
    }

    public Task<int?> GetTokenVersionAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => (int?)u.TokenVersion)
            .FirstOrDefaultAsync(cancellationToken);
}
