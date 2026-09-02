using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class ConversationTests
{
    [Fact]
    public void UpdateLastMessage_WhenFirstMessage_UpdatesSummary()
    {
        // Arrange
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        var messageId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var content = "Hello tutor, I have a question about math.";

        // Act
        conversation.UpdateLastMessage(messageId, content, now);

        // Assert
        conversation.LastMessageId.Should().Be(messageId);
        conversation.LastMessageAt.Should().Be(now);
        conversation.LastMessagePreview.Should().Be(content);
    }

    [Fact]
    public void UpdateLastMessage_WhenNewerMessageArrives_UpdatesSummary()
    {
        // Arrange
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        var firstId = Guid.NewGuid();
        var firstTime = DateTime.UtcNow.AddMinutes(-5);
        conversation.UpdateLastMessage(firstId, "First message", firstTime);

        var secondId = Guid.NewGuid();
        var secondTime = DateTime.UtcNow;
        var secondContent = "Second newer message";

        // Act
        conversation.UpdateLastMessage(secondId, secondContent, secondTime);

        // Assert
        conversation.LastMessageId.Should().Be(secondId);
        conversation.LastMessageAt.Should().Be(secondTime);
        conversation.LastMessagePreview.Should().Be(secondContent);
    }

    [Fact]
    public void UpdateLastMessage_WhenOlderMessageArrivesOutOfOrder_DoesNotOverwriteNewerSummary()
    {
        // Arrange
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        var newerId = Guid.NewGuid();
        var newerTime = DateTime.UtcNow;
        var newerContent = "Newer message";
        conversation.UpdateLastMessage(newerId, newerContent, newerTime);

        var olderId = Guid.NewGuid();
        var olderTime = DateTime.UtcNow.AddMinutes(-10);
        var olderContent = "Older out-of-order message";

        // Act
        conversation.UpdateLastMessage(olderId, olderContent, olderTime);

        // Assert (INV-EVENT-019)
        conversation.LastMessageId.Should().Be(newerId);
        conversation.LastMessageAt.Should().Be(newerTime);
        conversation.LastMessagePreview.Should().Be(newerContent);
    }

    [Fact]
    public void UpdateLastMessage_WhenContentExceeds100Chars_TruncatesPreview()
    {
        // Arrange
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        var messageId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var longContent = new string('A', 250);

        // Act
        conversation.UpdateLastMessage(messageId, longContent, now);

        // Assert
        conversation.LastMessagePreview.Should().HaveLength(100);
        conversation.LastMessagePreview.Should().Be(new string('A', 100));
    }
}
