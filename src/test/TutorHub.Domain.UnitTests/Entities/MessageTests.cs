using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class MessageTests
{
    [Fact]
    public void MarkAsRead_WhenUnread_SetsIsReadAndReadAt()
    {
        // Arrange
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = Guid.NewGuid(),
            SenderUserId = Guid.NewGuid(),
            Content = "Hello",
            CreatedAt = DateTime.UtcNow
        };

        var readAt = DateTime.UtcNow;

        // Act
        message.MarkAsRead(readAt);

        // Assert
        message.IsRead.Should().BeTrue();
        message.ReadAt.Should().Be(readAt);
    }

    [Fact]
    public void MarkAsRead_WhenAlreadyRead_PreservesOriginalReadAt()
    {
        // Arrange
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = Guid.NewGuid(),
            SenderUserId = Guid.NewGuid(),
            Content = "Hello",
            CreatedAt = DateTime.UtcNow
        };

        var firstReadAt = DateTime.UtcNow.AddMinutes(-5);
        message.MarkAsRead(firstReadAt);

        var secondReadAt = DateTime.UtcNow;

        // Act
        message.MarkAsRead(secondReadAt);

        // Assert
        message.IsRead.Should().BeTrue();
        message.ReadAt.Should().Be(firstReadAt);
    }
}
