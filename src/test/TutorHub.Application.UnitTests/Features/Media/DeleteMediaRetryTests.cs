using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Storage;
using TutorHub.Application.Features.Media.DeleteMedia;
using TutorHub.Application.Features.Media.GetMediaUrl;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Features.Media;

public class DeleteMediaRetryTests
{
    [Fact]
    public async Task StorageFailure_HidesFileButAllowsOnlyOwnerToRetryDeletion()
    {
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new StubCurrentUserService().Set(Guid.NewGuid(), UserRole.Student);
        var media = new TutorHub.Domain.Entities.Media { Id = Guid.NewGuid(), ObjectKey = "test/retry.png", OriginalFileName = "retry.png", ContentType = "image/png", UploadedByUserId = user.UserId!.Value, Status = MediaStatus.Active };
        db.Media.Add(media); await db.SaveChangesAsync();
        var storage = new Mock<IObjectStorageService>();
        storage.SetupSequence(s => s.DeleteAsync(media.ObjectKey, It.IsAny<CancellationToken>())).ThrowsAsync(new IOException("Temporary outage")).Returns(Task.CompletedTask);
        var handler = new DeleteMediaCommandHandler(db, StubClock.Instance, storage.Object, user);
        await Assert.ThrowsAsync<IOException>(() => handler.Handle(new DeleteMediaCommand(media.Id), CancellationToken.None));
        Assert.Equal(MediaStatus.Deleted, media.Status);
        await Assert.ThrowsAsync<NotFoundException>(() => new GetMediaUrlQueryHandler(db, storage.Object, user).Handle(new GetMediaUrlQuery(media.Id), CancellationToken.None));
        var stranger = new StubCurrentUserService().Set(Guid.NewGuid(), UserRole.Student);
        await Assert.ThrowsAsync<ForbiddenException>(() => new DeleteMediaCommandHandler(db, StubClock.Instance, storage.Object, stranger).Handle(new DeleteMediaCommand(media.Id), CancellationToken.None));
        Assert.True(await handler.Handle(new DeleteMediaCommand(media.Id), CancellationToken.None));
        storage.Verify(s => s.DeleteAsync(media.ObjectKey, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
