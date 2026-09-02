using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Application.Features.Notifications.DTOs;
using TutorHub.Infrastructure.Hubs;
using TutorHub.Infrastructure.Services;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Realtime;

public class SignalRServiceTests
{
    private readonly Mock<IHubContext<NotificationHub, INotificationClient>> _notificationHubMock = new();
    private readonly Mock<IHubContext<ChatHub, IChatClient>> _chatHubMock = new();
    private readonly Mock<IHubClients<INotificationClient>> _notificationClientsMock = new();
    private readonly Mock<IHubClients<IChatClient>> _chatClientsMock = new();
    private readonly Mock<INotificationClient> _notificationClientMock = new();
    private readonly Mock<IChatClient> _chatClientMock = new();

    public SignalRServiceTests()
    {
        _notificationHubMock.Setup(h => h.Clients).Returns(_notificationClientsMock.Object);
        _notificationClientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_notificationClientMock.Object);
        _notificationClientsMock.Setup(c => c.User(It.IsAny<string>())).Returns(_notificationClientMock.Object);

        _chatHubMock.Setup(h => h.Clients).Returns(_chatClientsMock.Object);
        _chatClientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_chatClientMock.Object);
    }

    [Fact]
    public async Task SignalRNotificationService_SendRealtimeNotificationAsync_PushesToGroupAndUser()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<SignalRNotificationService>>();
        var service = new SignalRNotificationService(_notificationHubMock.Object, loggerMock.Object);
        var userId = Guid.NewGuid();
        var dto = new NotificationDto { Id = Guid.NewGuid(), UserId = userId, Title = "Test" };

        // Act
        await service.SendRealtimeNotificationAsync(userId, dto, CancellationToken.None);

        // Assert
        _notificationClientMock.Verify(c => c.ReceiveNotification(dto), Times.Exactly(2));
    }

    [Fact]
    public async Task SignalRChatNotificationService_SendMessageRealtimeAsync_PushesToConversationGroup()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<SignalRChatNotificationService>>();
        var service = new SignalRChatNotificationService(_chatHubMock.Object, loggerMock.Object);
        var conversationId = Guid.NewGuid();
        var message = new MessageDto { Id = Guid.NewGuid(), ConversationId = conversationId, Content = "Hello" };

        // Act
        await service.SendMessageRealtimeAsync(conversationId, message, CancellationToken.None);

        // Assert
        _chatClientMock.Verify(c => c.ReceiveMessage(message), Times.Once);
    }
}
