using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Api.Controllers;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.SendMessage;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class ConversationAttachmentAuthorizationTests : IntegrationTestBase
{
    public ConversationAttachmentAuthorizationTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task SendMessage_OnlyAcceptsAttachmentUploadedBySenderToSameConversation()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var first = new Conversation
        {
            Id = Guid.NewGuid(), StudentProfileId = student.Id, TutorProfileId = tutor.Id
        };
        var (otherTutorUser, otherTutor, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var second = new Conversation
        {
            Id = Guid.NewGuid(), StudentProfileId = student.Id, TutorProfileId = otherTutor.Id
        };
        Db.Conversations.AddRange(first, second);
        var key = $"{Guid.NewGuid():N}.pdf";
        Db.ConversationAttachments.Add(new ConversationAttachment
        {
            StorageKey = key, ConversationId = first.Id,
            UploadedByUserId = studentUser.Id, FileName = "proof.pdf",
            ContentType = "application/pdf", Size = 42, CreatedAt = DateTime.UtcNow
        });
        await Db.SaveChangesAsync();
        SetCurrentUser(studentUser.Id, UserRole.Student);

        var wrongConversation = () => SendAsync(new SendMessageCommand(
            second.Id, "", key, "fake.pdf", "application/pdf", 42));
        await wrongConversation.Should().ThrowAsync<ForbiddenException>();

        var sent = await SendAsync(new SendMessageCommand(
            first.Id, "", key, "fake.pdf", "application/pdf", 42));
        sent.AttachmentName.Should().Be("proof.pdf");
        (await Db.Messages.AsNoTracking().SingleAsync(m => m.Id == sent.Id))
            .AttachmentKey.Should().Be(key);

        var storage = new Mock<IFileStorage>();
        var controller = new ConversationsController(Sender, storage.Object, Db, Factory.CurrentUser);
        var wrongDownload = () => controller.DownloadAttachment(second.Id, key, CancellationToken.None);
        await wrongDownload.Should().ThrowAsync<NotFoundException>();
        storage.Verify(s => s.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
