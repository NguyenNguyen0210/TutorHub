using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.MarkConversationAsRead;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Conversations;

public class MarkConversationAsReadCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    [Fact]
    public async Task Handle_MarksAllIncomingUnreadMessagesAsRead()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var tutorUserId = Guid.NewGuid();

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUserId };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUserId };

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var messages = new List<Message>
        {
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = tutorUserId, Content = "Incoming 1" },
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = tutorUserId, Content = "Incoming 2" },
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = studentUserId, Content = "My own message" }
        };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(studentUserId);

        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);
        _dbContextMock.Setup(c => c.Messages).Returns(MockDbSetHelper.CreateMockDbSet(messages).Object);

        var handler = new MarkConversationAsReadCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var result = await handler.Handle(new MarkConversationAsReadCommand(conversation.Id), CancellationToken.None);

        // Assert
        result.Should().Be(2);
        messages[0].IsRead.Should().BeTrue();
        messages[1].IsRead.Should().BeTrue();
        messages[2].IsRead.Should().BeFalse(); // Sender's own message is unchanged
    }
}
