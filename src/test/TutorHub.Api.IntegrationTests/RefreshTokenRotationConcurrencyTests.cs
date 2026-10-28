using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Domain.Entities;

namespace TutorHub.Api.IntegrationTests;

public class RefreshTokenRotationConcurrencyTests : IntegrationTestBase
{
    public RefreshTokenRotationConcurrencyTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task TwoWritersCannotRevokeSameActiveToken()
    {
        var (user, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(), UserId = user.Id,
            TokenHash = $"hash-{Guid.NewGuid():N}",
            CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        Db.RefreshTokens.Add(token);
        await Db.SaveChangesAsync();

        using var firstScope = Factory.Services.CreateScope();
        using var secondScope = Factory.Services.CreateScope();
        var first = firstScope.ServiceProvider.GetRequiredService<TutorHub.Infrastructure.Persistence.AppDbContext>();
        var second = secondScope.ServiceProvider.GetRequiredService<TutorHub.Infrastructure.Persistence.AppDbContext>();
        var firstCopy = await first.RefreshTokens.SingleAsync(t => t.Id == token.Id);
        var secondCopy = await second.RefreshTokens.SingleAsync(t => t.Id == token.Id);
        firstCopy.RevokedAt = DateTime.UtcNow;
        secondCopy.RevokedAt = DateTime.UtcNow.AddSeconds(1);

        await first.SaveChangesAsync();
        var losingWrite = () => second.SaveChangesAsync();
        await losingWrite.Should().ThrowAsync<DbUpdateConcurrencyException>();
    }
}
