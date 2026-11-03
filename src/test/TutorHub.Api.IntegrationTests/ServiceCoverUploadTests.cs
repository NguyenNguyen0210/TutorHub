using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Media.CompleteUpload;
using TutorHub.Application.Features.Media.GenerateUploadUrl;
using TutorHub.Application.Features.Media.GetPublicCover;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class ServiceCoverUploadTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    private static byte[] Png => Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8WQAAAAASUVORK5CYII=");

    [Fact]
    public async Task TutorUploadsBinaryCover_AndAnonymousStableUrlRefreshesStorageAccess()
    {
        var (owner, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(owner.Id, UserRole.Tutor);
        using var client = Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(owner));
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("ServiceCover"), "mediaType");
        form.Add(new ByteArrayContent(Png), "file", "cover.png");
        var upload = await client.PostAsync("/api/v1/media/upload", form);
        upload.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await upload.Content.ReadAsStringAsync());
        var id = json.RootElement.GetProperty("data").GetProperty("id").GetGuid();
        var saved = await Db.Media.AsNoTracking().SingleAsync(x => x.Id == id);
        saved.MediaType.Should().Be(MediaType.ServiceCover);
        saved.IsPrivate.Should().BeFalse();
        saved.UploadedByUserId.Should().Be(owner.Id);
        saved.ObjectKey.Should().Contain($"tutors/{owner.Id}/covers/");
        client.DefaultRequestHeaders.Authorization = null;
        SetCurrentUser(null, null, false);
        for (var i = 0; i < 2; i++)
        {
            var image = await client.GetAsync($"/api/v1/media/{id}/cover");
            image.StatusCode.Should().Be(HttpStatusCode.Found);
            image.Headers.Location!.Host.Should().Be("storage.test");
            image.Headers.CacheControl!.NoStore.Should().BeTrue();
        }
        (await client.GetAsync($"/api/v1/media/{id}/avatar")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData(MediaType.Certificate, true, MediaStatus.Active, "image/png")]
    [InlineData(MediaType.General, false, MediaStatus.Active, "image/png")]
    [InlineData(MediaType.Avatar, false, MediaStatus.Active, "image/png")]
    [InlineData(MediaType.ServiceCover, true, MediaStatus.Active, "image/png")]
    [InlineData(MediaType.ServiceCover, false, MediaStatus.Deleted, "image/png")]
    [InlineData(MediaType.ServiceCover, false, MediaStatus.Active, "application/pdf")]
    public async Task CoverEndpointNeverServesPrivateDocumentsOtherPurposesOrDeletedFiles(MediaType type, bool privacy, MediaStatus status, string mime)
    {
        var (_, _, owner) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var media = new Media { Id = Guid.NewGuid(), UploadedByUserId = owner.Id, ObjectKey = $"test/{Guid.NewGuid()}", OriginalFileName = "test.png", ContentType = mime, FileSize = 100, StorageProvider = StorageProvider.LocalFileSystem, MediaType = type, IsPrivate = privacy, Status = status, CreatedAt = DateTime.UtcNow };
        Db.Media.Add(media); await Db.SaveChangesAsync();
        SetCurrentUser(null, null, false);
        await Assert.ThrowsAsync<NotFoundException>(() => SendAsync(new GetPublicCoverQuery(media.Id)));
    }

    [Fact]
    public async Task CoverUploadRejectsNonTutorsDisguisedDocumentsOversizedFilesAndUnverifiedPresignedUploads()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        using var image = new MemoryStream(Png);
        SetCurrentUser(student.Id, UserRole.Student);
        await Assert.ThrowsAsync<ForbiddenException>(() => SendAsync(new UploadMediaCommand(image, "cover.png", "image/png", image.Length, MediaType.ServiceCover)));
        SetCurrentUser(tutorUser.Id, UserRole.Tutor);
        using var fake = new MemoryStream("%PDF-1.7 This is a document, not an image."u8.ToArray());
        await Assert.ThrowsAsync<BadRequestException>(() => SendAsync(new UploadMediaCommand(fake, "cover.png", "image/png", fake.Length, MediaType.ServiceCover)));
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(new UploadMediaCommand(image, "cover.png", "image/png", 5 * 1024 * 1024 + 1, MediaType.ServiceCover)));
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(new UploadMediaCommand(image, "cover.pdf", "application/pdf", image.Length, MediaType.ServiceCover)));
        await Assert.ThrowsAsync<BadRequestException>(() => SendAsync(new GenerateUploadUrlCommand("cover.png", "image/png", image.Length, MediaType.ServiceCover)));
        await Assert.ThrowsAsync<BadRequestException>(() => SendAsync(new CompleteUploadCommand($"general/{tutorUser.Id}/fake.png", "cover.png", "image/png", image.Length, MediaType.ServiceCover)));
        (await Db.Media.CountAsync(x => x.UploadedByUserId == tutorUser.Id)).Should().Be(0);
    }
}
