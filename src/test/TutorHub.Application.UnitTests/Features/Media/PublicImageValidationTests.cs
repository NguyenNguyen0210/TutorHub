using System.Text;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Storage;
using TutorHub.Application.Features.Media.CompleteUpload;
using TutorHub.Application.Features.Media.GenerateUploadUrl;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using TutorHub.Infrastructure.Services;

namespace TutorHub.Application.UnitTests.Features.Media;

public class PublicImageValidationTests
{
    [Fact]
    public async Task PresignedAvatarRejectsPdfAtGenerationValidationAndCompletionEvenWithValidSignature()
    {
        var user = new StubCurrentUserService().Set(Guid.NewGuid(), UserRole.Student);
        var bytes = Encoding.ASCII.GetBytes("%PDF-1.7\nvalid PDF header");
        var key = $"profiles/{user.UserId}/avatar/audit.pdf";
        var request = new CompleteUploadCommand(key, "audit.pdf", "application/pdf", bytes.Length, MediaType.Avatar);
        Assert.False((await new CompleteUploadCommandValidator().ValidateAsync(request)).IsValid);
        Assert.False((await new GenerateUploadUrlCommandValidator().ValidateAsync(new GenerateUploadUrlCommand("audit.pdf", "application/pdf", bytes.Length, MediaType.Avatar))).IsValid);
        // A direct handler call also protects the boundary, independent of validation middleware.
        var storage = new Mock<IObjectStorageService>();
        storage.Setup(s => s.GetMetadataAsync(key, It.IsAny<CancellationToken>())).ReturnsAsync(new StoredFileResult(key, bytes.Length, "application/pdf", null));
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var handler = new CompleteUploadCommandHandler(db, new SystemClock(), storage.Object, user);
        await Assert.ThrowsAsync<BadRequestException>(() => handler.Handle(request, CancellationToken.None));
        Assert.Empty(await db.Media.ToListAsync());
    }

    [Theory]
    [InlineData("photo.JPG", "image/jpeg", MediaType.Avatar, true)]
    [InlineData("photo.png", "image/png", MediaType.Avatar, true)]
    [InlineData("document.pdf", "application/pdf", MediaType.Certificate, true)]
    [InlineData("photo.png", "application/pdf", MediaType.Avatar, false)]
    [InlineData("photo.png", "image/png", (MediaType)999, false)]
    public void GenerationValidatesPurposeWithoutBlockingPrivateDocuments(string fileName, string mime, MediaType type, bool valid)
    {
        Assert.Equal(valid, new GenerateUploadUrlCommandValidator().Validate(new GenerateUploadUrlCommand(fileName, mime, 100, type)).IsValid);
    }
}
