using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.SendMessage;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Conversations;

public class SendMessageCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    [Fact]
    public async Task Handle_WhenSenderIsParticipant_PersistsMessageAndOutboxAndUpdatesSummary()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student Alice" };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor Bob" };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var messagesList = new List<Message>();
        var outboxList = new List<OutboxMessage>();

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(studentUser.Id);

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { studentUser, tutorUser }).Object);
        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);
        _dbContextMock.Setup(c => c.Messages).Returns(MockDbSetHelper.CreateMockDbSet(messagesList).Object);
        _dbContextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxList).Object);

        var handler = new SendMessageCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        var command = new SendMessageCommand(conversation.Id, "Hello Tutor!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Content.Should().Be("Hello Tutor!");
        result.SenderUserId.Should().Be(studentUser.Id);

        messagesList.Should().HaveCount(1);
        messagesList[0].Content.Should().Be("Hello Tutor!");

        // Outbox event was created in same atomic transaction (INV-EVENT-001, INV-EVENT-009)
        outboxList.Should().HaveCount(1);
        outboxList[0].EventType.Should().Be("MessageSent");
        outboxList[0].AggregateId.Should().Be(conversation.Id);
        outboxList[0].Payload.Should().Contain("Hello Tutor!");

        // Conversation summary was updated (INV-EVENT-019)
        conversation.LastMessageId.Should().Be(messagesList[0].Id);
        conversation.LastMessagePreview.Should().Be("Hello Tutor!");
    }

    [Fact]
    public async Task Handle_WhenSenderIsNotParticipant_ThrowsForbiddenException()
    {
        // Arrange
        var outsiderUserId = Guid.NewGuid();

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
        _currentUserServiceMock.Setup(c => c.UserId).Returns(outsiderUserId);

        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);

        var handler = new SendMessageCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        var command = new SendMessageCommand(conversation.Id, "Intruder message");

        // Act
        var act = () => handler.Handle(command, CancellationToken.None);

        // Assert (INV-MSG-003, INV-MSG-004)
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("Only conversation participants can send messages"));
    }
}
