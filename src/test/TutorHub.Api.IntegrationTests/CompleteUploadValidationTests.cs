using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Files;
using TutorHub.Application.Common.Storage;
using TutorHub.Application.Features.Media.CompleteUpload;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class CompleteUploadValidationTests : IntegrationTestBase
{
    public CompleteUploadValidationTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task CompleteUpload_RejectsFalseMetadataAndInvalidBytes()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(studentUser.Id, UserRole.Student);
        var storage = Factory.Services.GetRequiredService<IObjectStorageService>();
        var key = $"general/{studentUser.Id}/{Guid.NewGuid():N}.png";
        var pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0 };
        await storage.UploadAsync(new MemoryStream(pngHeader), key, "image/png");

        var wrongSize = () => SendAsync(new CompleteUploadCommand(key, "photo.png", "image/png", 13, MediaType.General));
        await wrongSize.Should().ThrowAsync<BadRequestException>();

        var wrongType = () => SendAsync(new CompleteUploadCommand(key, "photo.png", "image/jpeg", 12, MediaType.General));
        await wrongType.Should().ThrowAsync<BadRequestException>();

        var oversized = new byte[checked((int)UploadLimits.MediaPresignedMaxBytes + 1)];
        await storage.UploadAsync(new MemoryStream(oversized), key, "image/png");
        var tooLarge = () => SendAsync(new CompleteUploadCommand(key, "photo.png", "image/png", oversized.LongLength, MediaType.General));
        await tooLarge.Should().ThrowAsync<BadRequestException>();

        await storage.UploadAsync(new MemoryStream(new byte[12]), key, "image/png");
        var wrongBytes = () => SendAsync(new CompleteUploadCommand(key, "photo.png", "image/png", 12, MediaType.General));
        await wrongBytes.Should().ThrowAsync<BadRequestException>();
        (await Db.Media.AsNoTracking().CountAsync(m => m.ObjectKey == key)).Should().Be(0);

        await storage.UploadAsync(new MemoryStream(pngHeader), key, "image/png");
        var accepted = await SendAsync(new CompleteUploadCommand(key, "photo.png", "image/png", 12, MediaType.General));
        accepted.FileSize.Should().Be(12);
    }
}
