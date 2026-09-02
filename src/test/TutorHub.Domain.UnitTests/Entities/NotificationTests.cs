using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class NotificationTests
{
    [Fact]
    public void MarkAsRead_WhenUnread_MarksAsReadWithTimestamp()
    {
        // Arrange
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Title = "Title",
            Message = "Message",
            Type = "Type"
        };
        var now = DateTime.UtcNow;

        // Act
        notification.MarkAsRead(now);

        // Assert
        notification.IsRead.Should().BeTrue();
        notification.ReadAt.Should().Be(now);
    }

    [Fact]
    public void MarkAsRead_WhenAlreadyRead_PreservesOriginalTimestamp()
    {
        // Arrange
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Title = "Title",
            Message = "Message",
            Type = "Type"
        };
        var initial = DateTime.UtcNow.AddHours(-1);
        notification.MarkAsRead(initial);

        // Act
        notification.MarkAsRead(DateTime.UtcNow);

        // Assert
        notification.IsRead.Should().BeTrue();
        notification.ReadAt.Should().Be(initial);
    }
}
