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
using TutorHub.Application.Features.Media.GetPublicDemoVideo;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class ServiceDemoVideoUploadTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    // ISO BMFF header: size + 'ftyp' + brand 'mp42'. Enough for signature validation.
    private static byte[] Mp4 =>
    [
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];

    [Fact]
    public async Task TutorUploadsMp4_AndAnonymousPlaybackUrlRedirectsToStorage()
    {
        var (owner, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(owner.Id, UserRole.Tutor);
        using var client = Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(owner));

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("ServiceDemoVideo"), "mediaType");
        form.Add(new ByteArrayContent(Mp4), "file", "demo.mp4");

        var upload = await client.PostAsync("/api/v1/media/upload", form);
        upload.StatusCode.Should().Be(HttpStatusCode.OK);

        using var json = JsonDocument.Parse(await upload.Content.ReadAsStringAsync());
        var id = json.RootElement.GetProperty("data").GetProperty("id").GetGuid();

        var saved = await Db.Media.AsNoTracking().SingleAsync(x => x.Id == id);
        saved.MediaType.Should().Be(MediaType.ServiceDemoVideo);
        saved.ContentType.Should().Be("video/mp4");
        saved.IsPrivate.Should().BeFalse();
        saved.UploadedByUserId.Should().Be(owner.Id);
        saved.ObjectKey.Should().Contain($"tutors/{owner.Id}/demo-videos/");

        client.DefaultRequestHeaders.Authorization = null;
        SetCurrentUser(null, null, false);

        var playback = await client.GetAsync($"/api/v1/media/{id}/demo-video");
        playback.StatusCode.Should().Be(HttpStatusCode.Found);
        playback.Headers.Location!.Host.Should().Be("storage.test");
        playback.Headers.Location.AbsolutePath.Should().Contain("demo-videos");

        // A demo video must not leak through the image/document endpoints.
        (await client.GetAsync($"/api/v1/media/{id}/cover")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.GetAsync($"/api/v1/media/{id}/avatar")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData(MediaType.ServiceCover, false, MediaStatus.Active, "video/mp4")]
    [InlineData(MediaType.General, false, MediaStatus.Active, "video/mp4")]
    [InlineData(MediaType.ServiceDemoVideo, true, MediaStatus.Active, "video/mp4")]
    [InlineData(MediaType.ServiceDemoVideo, false, MediaStatus.Deleted, "video/mp4")]
    [InlineData(MediaType.ServiceDemoVideo, false, MediaStatus.Active, "application/pdf")]
    public async Task PlaybackEndpointNeverServesOtherPurposesPrivateOrDeletedFiles(
        MediaType type, bool privacy, MediaStatus status, string mime)
    {
        var (_, _, owner) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var media = new Media
        {
            Id = Guid.NewGuid(),
            UploadedByUserId = owner.Id,
            ObjectKey = $"test/{Guid.NewGuid()}",
            OriginalFileName = "demo.mp4",
            ContentType = mime,
            FileSize = 100,
            StorageProvider = StorageProvider.LocalFileSystem,
            MediaType = type,
            IsPrivate = privacy,
            Status = status,
            CreatedAt = DateTime.UtcNow
        };
        Db.Media.Add(media);
        await Db.SaveChangesAsync();

        SetCurrentUser(null, null, false);
        await Assert.ThrowsAsync<NotFoundException>(() => SendAsync(new GetPublicDemoVideoQuery(media.Id)));
    }

    [Fact]
    public async Task DemoVideoUploadRejectsNonTutorsWrongFormatsOversizedFilesAndUnverifiedPresignedUploads()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        using var video = new MemoryStream(Mp4);
        SetCurrentUser(student.Id, UserRole.Student);
        await Assert.ThrowsAsync<ForbiddenException>(() => SendAsync(
            new UploadMediaCommand(video, "demo.mp4", "video/mp4", video.Length, MediaType.ServiceDemoVideo)));

        SetCurrentUser(tutorUser.Id, UserRole.Tutor);

        // Declared .mp4 but the bytes are plain text → signature rejection.
        using var disguised = new MemoryStream("this is not a video at all"u8.ToArray());
        await Assert.ThrowsAsync<BadRequestException>(() => SendAsync(
            new UploadMediaCommand(disguised, "demo.mp4", "video/mp4", disguised.Length, MediaType.ServiceDemoVideo)));

        using var wrongExt = new MemoryStream(Mp4);
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(
            new UploadMediaCommand(wrongExt, "demo.mov", "video/quicktime", wrongExt.Length, MediaType.ServiceDemoVideo)));

        using var oversized = new MemoryStream(Mp4);
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(
            new UploadMediaCommand(oversized, "demo.mp4", "video/mp4", 100L * 1024 * 1024 + 1, MediaType.ServiceDemoVideo)));

        // Presigned uploads skip signature validation, so they are refused for
        // videos: the extension whitelist rejects .mp4 before the handler guard.
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(
            new GenerateUploadUrlCommand("demo.mp4", "video/mp4", 1024, MediaType.ServiceDemoVideo)));
        await Assert.ThrowsAsync<BadRequestException>(() => SendAsync(
            new CompleteUploadCommand($"tutors/{tutorUser.Id}/demo-videos/fake.mp4", "demo.mp4", "video/mp4", 1024, MediaType.ServiceDemoVideo)));

        (await Db.Media.CountAsync(x => x.UploadedByUserId == tutorUser.Id)).Should().Be(0);
    }
}
