using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Conversations.AdminGetConversationMessages;
using TutorHub.Application.Features.Admin.Conversations.AdminGetConversations;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Conversations;

public class AdminConversationHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<ILogger<AdminGetConversationsQueryHandler>> _loggerMock = new();
    private readonly Mock<ILogger<AdminGetConversationMessagesQueryHandler>> _messagesLoggerMock = new();

    [Fact]
    public async Task AdminGetConversations_WhenNonAdmin_ThrowsForbiddenException()
    {
        // Arrange
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _currentUserServiceMock.Setup(c => c.Role).Returns("Student");

        var handler = new AdminGetConversationsQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object, _loggerMock.Object);

        // Act
        var act = () => handler.Handle(new AdminGetConversationsQuery("Dispute #123 investigation"), CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("Only administrators can access all conversations"));
    }

    [Fact]
    public async Task AdminGetConversations_WhenReasonTooShort_ThrowsBadRequestException()
    {
        // Arrange
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _currentUserServiceMock.Setup(c => c.Role).Returns("Admin");

        var handler = new AdminGetConversationsQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object, _loggerMock.Object);

        // Act
        var act = () => handler.Handle(new AdminGetConversationsQuery("abc"), CancellationToken.None);

        // Assert (DEC-S7-016: OperationalReason >= 5 chars)
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("valid operational reason"));
    }

    [Fact]
    public async Task AdminGetConversationMessages_WhenAdminWithValidReason_ReturnsMessages()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var conversation = new Conversation { Id = Guid.NewGuid() };
        var sender = new User { Id = Guid.NewGuid(), FullName = "Alice" };
        var messages = new List<Message>
        {
            new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = sender.Id, SenderUser = sender, Content = "Admin read test" }
        };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(adminId);
        _currentUserServiceMock.Setup(c => c.Role).Returns("Admin");

        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);
        _dbContextMock.Setup(c => c.Messages).Returns(MockDbSetHelper.CreateMockDbSet(messages).Object);

        var handler = new AdminGetConversationMessagesQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object, _messagesLoggerMock.Object);

        // Act
        var result = await handler.Handle(new AdminGetConversationMessagesQuery(conversation.Id, "Dispute investigation #456"), CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items[0].Content.Should().Be("Admin read test");
    }
}
