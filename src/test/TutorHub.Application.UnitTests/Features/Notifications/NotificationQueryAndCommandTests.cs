using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Notifications.GetMyNotifications;
using TutorHub.Application.Features.Notifications.GetUnreadNotificationCount;
using TutorHub.Application.Features.Notifications.MarkAllNotificationsAsRead;
using TutorHub.Application.Features.Notifications.MarkNotificationAsRead;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Notifications;

public class NotificationQueryAndCommandTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    [Fact]
    public async Task GetMyNotifications_ReturnsUserNotificationsWithKeysetPagination()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(userId);

        var notifications = new List<Notification>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, Title = "N1", Message = "M1", Type = "T1", CreatedAt = DateTime.UtcNow.AddMinutes(-10) },
            new() { Id = Guid.NewGuid(), UserId = userId, Title = "N2", Message = "M2", Type = "T2", CreatedAt = DateTime.UtcNow.AddMinutes(-5) },
            new() { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Title = "Other", Message = "Other", Type = "T3", CreatedAt = DateTime.UtcNow }
        };

        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);

        var handler = new GetMyNotificationsQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object);
        var query = new GetMyNotificationsQuery(PageSize: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items[0].Title.Should().Be("N2"); // Newest first
    }

    [Fact]
    public async Task GetUnreadNotificationCount_ReturnsCorrectCount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(userId);

        var notif1 = new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "N1", Message = "M1", Type = "T1" };
        var notif2 = new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "N2", Message = "M2", Type = "T2" };
        notif2.MarkAsRead(DateTime.UtcNow);

        var notifications = new List<Notification> { notif1, notif2 };
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);

        var handler = new GetUnreadNotificationCountQueryHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var count = await handler.Handle(new GetUnreadNotificationCountQuery(), CancellationToken.None);

        // Assert
        count.Should().Be(1);
    }

    [Fact]
    public async Task MarkNotificationAsRead_WhenOwner_MarksAsRead()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(userId);

        var notif = new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "N1", Message = "M1", Type = "T1" };
        var notifications = new List<Notification> { notif };
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);

        var handler = new MarkNotificationAsReadCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var result = await handler.Handle(new MarkNotificationAsReadCommand(notif.Id), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        notif.IsRead.Should().BeTrue();
        notif.ReadAt.Should().NotBeNull();
    }

    [Fact]
    public async Task MarkNotificationAsRead_WhenNotOwner_ThrowsForbiddenException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(userId);

        var notif = new Notification { Id = Guid.NewGuid(), UserId = otherUserId, Title = "N1", Message = "M1", Type = "T1" };
        var notifications = new List<Notification> { notif };
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);

        var handler = new MarkNotificationAsReadCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var act = () => handler.Handle(new MarkNotificationAsReadCommand(notif.Id), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task MarkAllNotificationsAsRead_MarksAllUnreadForUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(userId);

        var notif1 = new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "N1", Message = "M1", Type = "T1" };
        var notif2 = new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "N2", Message = "M2", Type = "T2" };

        var notifications = new List<Notification> { notif1, notif2 };
        _dbContextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notifications).Object);

        var handler = new MarkAllNotificationsAsReadCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var count = await handler.Handle(new MarkAllNotificationsAsReadCommand(), CancellationToken.None);

        // Assert
        count.Should().Be(2);
        notif1.IsRead.Should().BeTrue();
        notif2.IsRead.Should().BeTrue();
    }
}
