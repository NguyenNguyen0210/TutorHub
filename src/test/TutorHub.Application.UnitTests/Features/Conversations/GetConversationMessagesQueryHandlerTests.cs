using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.GetConversationMessages;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Conversations;

public class GetConversationMessagesQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    [Fact]
    public async Task Handle_WhenParticipantRequests_ReturnsPagedMessages()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Alice" };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Bob" };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id };

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
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = studentUser.Id, SenderUser = studentUser, Content = "Msg 1", CreatedAt = DateTime.UtcNow.AddMinutes(-10) },
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = tutorUser.Id, SenderUser = tutorUser, Content = "Msg 2", CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
        };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(studentUser.Id);

        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);
        _dbContextMock.Setup(c => c.Messages).Returns(MockDbSetHelper.CreateMockDbSet(messages).Object);

        var handler = new GetConversationMessagesQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var result = await handler.Handle(new GetConversationMessagesQuery(conversation.Id, null, 20), CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items[0].Content.Should().Be("Msg 2"); // Ordered by CreatedAt DESC
        result.Items[1].Content.Should().Be("Msg 1");
    }

    [Fact]
    public async Task Handle_WhenNonParticipantRequests_ThrowsForbiddenException()
    {
        // Arrange
        var unauthorizedUserId = Guid.NewGuid();

        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid() };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid() };

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(unauthorizedUserId);

        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);

        var handler = new GetConversationMessagesQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var act = () => handler.Handle(new GetConversationMessagesQuery(conversation.Id, null, 20), CancellationToken.None);

        // Assert (INV-MSG-003, INV-MSG-006)
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("not authorized to view messages in this conversation"));
    }
}
