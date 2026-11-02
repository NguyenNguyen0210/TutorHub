using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Media.GetPublicAvatar;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class PublicAvatarTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task UploadedAvatar_HasAnonymousStableEndpoint_WithoutExposingOtherMedia()
    {
        var (_, _, owner) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(owner.Id, UserRole.Admin);
        using var image = new MemoryStream(Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8WQAAAAASUVORK5CYII="));
        var avatar = await SendAsync(new UploadMediaCommand(image, "avatar.png", "image/png", image.Length, MediaType.Avatar));
        SetCurrentUser(null, null, false);
        using var client = Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var response = await client.GetAsync($"/api/v1/media/{avatar.Id}/avatar");
        response.StatusCode.Should().Be(HttpStatusCode.Found);
        response.Headers.Location!.Host.Should().Be("storage.test");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        var again = await client.GetAsync($"/api/v1/media/{avatar.Id}/avatar");
        again.StatusCode.Should().Be(HttpStatusCode.Found);
    }

    [Theory]
    [InlineData(MediaType.Certificate, true, MediaStatus.Active)]
    [InlineData(MediaType.General, false, MediaStatus.Active)]
    [InlineData(MediaType.Avatar, true, MediaStatus.Active)]
    [InlineData(MediaType.Avatar, false, MediaStatus.Deleted)]
    public async Task PublicEndpoint_RejectsPrivateNonAvatarAndDeletedMedia(MediaType type, bool isPrivate, MediaStatus status)
    {
        var (_, _, owner) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var media = new Media {
            Id = Guid.NewGuid(), UploadedByUserId = owner.Id, ObjectKey = $"test/{Guid.NewGuid()}",
            OriginalFileName = "private.png", ContentType = "image/png", FileSize = 100,
            StorageProvider = StorageProvider.LocalFileSystem, MediaType = type, IsPrivate = isPrivate,
            Status = status, CreatedAt = DateTime.UtcNow
        };
        Db.Media.Add(media);
        await Db.SaveChangesAsync();
        SetCurrentUser(null, null, false);
        var query = () => SendAsync(new GetPublicAvatarQuery(media.Id));
        await query.Should().ThrowAsync<NotFoundException>();
    }
}
