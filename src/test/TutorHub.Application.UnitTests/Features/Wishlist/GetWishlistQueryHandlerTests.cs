using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Application.Features.Wishlist.GetWishlistIds;
using TutorHub.Application.Features.Wishlist.GetWishlistItems;
using TutorHub.Application.Features.Wishlist.RemoveWishlistItem;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wishlist;

public class GetWishlistQueryHandlerTests
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
    public async Task GetWishlistIds_ReturnsCorrectIds()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var tutorProfileId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();

        dbContext.WishlistItems.AddRange(
            new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                ItemType = WishlistItemType.Tutor,
                TutorProfileId = tutorProfileId,
                CreatedAt = DateTime.UtcNow
            },
            new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                ItemType = WishlistItemType.Service,
                ServiceId = serviceId,
                CreatedAt = DateTime.UtcNow
            },
            new WishlistItem // other user's item
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                ItemType = WishlistItemType.Tutor,
                TutorProfileId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            }
        );
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new GetWishlistIdsQueryHandler(dbContext, _currentUserServiceMock.Object);
        var result = await handler.Handle(new GetWishlistIdsQuery(), CancellationToken.None);

        result.TutorIds.Should().ContainSingle().Which.Should().Be(tutorProfileId);
        result.ServiceIds.Should().ContainSingle().Which.Should().Be(serviceId);
    }

    [Fact]
    public async Task GetWishlistItems_Tutors_ReturnsPagedTutors()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            FullName = "Tutor Bob",
            PasswordHash = "hash",
            Role = UserRole.Tutor
        };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Experienced tutor",
            Education = "PhD",
            ExperienceYears = 5
        };
        var wishItem = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            ItemType = WishlistItemType.Tutor,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(tutorUser);
        dbContext.TutorProfiles.Add(tutorProfile);
        dbContext.WishlistItems.Add(wishItem);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new GetWishlistItemsQueryHandler(dbContext, _currentUserServiceMock.Object);
        var result = await handler.Handle(new GetWishlistItemsQuery(WishlistItemType.Tutor, 1, 10), CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        var item = result.Items[0].Should().BeOfType<WishlistTutorDto>().Subject;
        item.FullName.Should().Be("Tutor Bob");
        item.TutorProfileId.Should().Be(tutorProfile.Id);
    }

    [Fact]
    public async Task GetWishlistItems_Services_ReturnsPagedServices()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var category = new Category { Id = Guid.NewGuid(), Name = "Category 1" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics", CategoryId = category.Id, Category = category };
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor2@test.com",
            FullName = "Tutor Alice",
            PasswordHash = "hash",
            Role = UserRole.Tutor
        };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Physics tutor",
            Education = "MSc"
        };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Physics Mechanics",
            Description = "Mechanics deep dive",
            Price = 150000,
            TotalSessions = 5,
            SessionDurationMinutes = 90,
            Status = ServiceStatus.Published
        };
        var wishItem = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            ItemType = WishlistItemType.Service,
            ServiceId = service.Id,
            Service = service,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Categories.Add(category);
        dbContext.Subjects.Add(subject);
        dbContext.Users.Add(tutorUser);
        dbContext.TutorProfiles.Add(tutorProfile);
        dbContext.Services.Add(service);
        dbContext.WishlistItems.Add(wishItem);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new GetWishlistItemsQueryHandler(dbContext, _currentUserServiceMock.Object);
        var result = await handler.Handle(new GetWishlistItemsQuery(WishlistItemType.Service, 1, 10), CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        var item = result.Items[0].Should().BeOfType<WishlistServiceDto>().Subject;
        item.Title.Should().Be("Physics Mechanics");
        item.TutorName.Should().Be("Tutor Alice");
        item.SubjectName.Should().Be("Physics");
    }

    [Fact]
    public async Task RemoveWishlistItem_WhenExists_RemovesAndReturnsTrue()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var tutorProfileId = Guid.NewGuid();
        var wishItem = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            ItemType = WishlistItemType.Tutor,
            TutorProfileId = tutorProfileId,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.WishlistItems.Add(wishItem);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new RemoveWishlistItemCommandHandler(dbContext, _currentUserServiceMock.Object);
        var result = await handler.Handle(new RemoveWishlistItemCommand(WishlistItemType.Tutor, tutorProfileId), CancellationToken.None);

        result.Should().BeTrue();
        (await dbContext.WishlistItems.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task RemoveWishlistItem_WhenNotExists_ReturnsFalse()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId);

        var handler = new RemoveWishlistItemCommandHandler(dbContext, _currentUserServiceMock.Object);
        var result = await handler.Handle(new RemoveWishlistItemCommand(WishlistItemType.Tutor, Guid.NewGuid()), CancellationToken.None);

        result.Should().BeFalse();
    }
}
