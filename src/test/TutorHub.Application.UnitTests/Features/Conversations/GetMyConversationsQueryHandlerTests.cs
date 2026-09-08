using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.GetMyConversations;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Conversations;

public class GetMyConversationsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    [Fact]
    public async Task Handle_ReturnsConversationsWithCalculatedUnreadCount()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Alice" };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Bob" };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };
        conversation.UpdateLastMessage(Guid.NewGuid(), "Hi there", DateTime.UtcNow);

        var messages = new List<Message>
        {
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = tutorUser.Id, Content = "Unread 1" },
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = tutorUser.Id, Content = "Unread 2" },
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = studentUser.Id, Content = "Sent by me" }
        };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(studentUser.Id);

        _dbContextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _dbContextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile>()).Object);
        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);
        _dbContextMock.Setup(c => c.Messages).Returns(MockDbSetHelper.CreateMockDbSet(messages).Object);

        var handler = new GetMyConversationsQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var result = await handler.Handle(new GetMyConversationsQuery(null, 20), CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be(conversation.Id);
        result.Items[0].UnreadCount.Should().Be(2); // Only incoming unread messages counted
    }
}
