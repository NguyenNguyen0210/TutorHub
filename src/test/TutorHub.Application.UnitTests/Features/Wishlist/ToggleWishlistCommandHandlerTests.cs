using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.ToggleWishlist;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wishlist;

public class ToggleWishlistCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    private IAppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenItemNotSaved_ShouldSaveAndReturnTrue()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            PasswordHash = "hash",
            FullName = "Tutor One",
            Role = UserRole.Tutor
        };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Bio",
            Education = "Edu"
        };
        dbContext.Users.Add(tutorUser);
        dbContext.TutorProfiles.Add(tutorProfile);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, tutorProfile.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFavorited.Should().BeTrue();
        result.Message.Should().Contain("yêu thích");
        (await dbContext.WishlistItems.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenItemAlreadySaved_ShouldRemoveAndReturnFalse()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            PasswordHash = "hash",
            FullName = "Tutor One",
            Role = UserRole.Tutor
        };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Bio",
            Education = "Edu"
        };
        var existingWish = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            ItemType = WishlistItemType.Tutor,
            TutorProfileId = tutorProfile.Id,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(tutorUser);
        dbContext.TutorProfiles.Add(tutorProfile);
        dbContext.WishlistItems.Add(existingWish);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, tutorProfile.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFavorited.Should().BeFalse();
        result.Message.Should().Contain("bỏ lưu");
        (await dbContext.WishlistItems.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_WhenTutorSavesSelf_ShouldThrowBadRequestException()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            Bio = "Bio",
            Education = "Edu"
        };
        dbContext.TutorProfiles.Add(tutorProfile);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, tutorProfile.Id);

        var act = () => handler.Handle(command, CancellationToken.None);
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("chính hồ sơ"));
    }

    [Fact]
    public async Task Handle_WhenUserNotAuthenticated_ShouldThrowUnauthorizedException()
    {
        var dbContext = CreateInMemoryDbContext();
        _currentUserServiceMock.Setup(s => s.UserId).Returns((Guid?)null);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, Guid.NewGuid());

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task Handle_WhenTutorNotFound_ShouldThrowNotFoundException()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var nonExistentId = Guid.NewGuid();
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, nonExistentId);

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenServiceNotSaved_ShouldSaveAndReturnTrue()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var category = new Category { Id = Guid.NewGuid(), Name = "Category 1" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math", CategoryId = category.Id, Category = category };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Math 101",
            Description = "Desc",
            Price = 100000,
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Status = ServiceStatus.Published
        };
        dbContext.Categories.Add(category);
        dbContext.Subjects.Add(subject);
        dbContext.Services.Add(service);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Service, service.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFavorited.Should().BeTrue();
        result.Message.Should().Contain("dịch vụ");
        (await dbContext.WishlistItems.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenServiceAlreadySaved_ShouldRemoveAndReturnFalse()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var category = new Category { Id = Guid.NewGuid(), Name = "Category 1" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math", CategoryId = category.Id, Category = category };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Math 101",
            Description = "Desc",
            Price = 100000,
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Status = ServiceStatus.Published
        };
        var existingWish = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            ItemType = WishlistItemType.Service,
            ServiceId = service.Id,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Categories.Add(category);
        dbContext.Subjects.Add(subject);
        dbContext.Services.Add(service);
        dbContext.WishlistItems.Add(existingWish);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Service, service.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFavorited.Should().BeFalse();
        (await dbContext.WishlistItems.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_WhenServiceNotFound_ShouldThrowNotFoundException()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var nonExistentId = Guid.NewGuid();
        var command = new ToggleWishlistCommand(WishlistItemType.Service, nonExistentId);

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
