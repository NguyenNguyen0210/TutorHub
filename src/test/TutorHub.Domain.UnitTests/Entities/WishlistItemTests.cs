using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class WishlistItemTests
{
    [Fact]
    public void CreateTutorWishlistItem_ShouldInitializeCorrectly()
    {
        var userId = Guid.NewGuid();
        var tutorProfileId = Guid.NewGuid();

        var item = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ItemType = WishlistItemType.Tutor,
            TutorProfileId = tutorProfileId,
            CreatedAt = DateTime.UtcNow
        };

        item.UserId.Should().Be(userId);
        item.ItemType.Should().Be(WishlistItemType.Tutor);
        item.TutorProfileId.Should().Be(tutorProfileId);
        item.ServiceId.Should().BeNull();
    }

    [Fact]
    public void CreateServiceWishlistItem_ShouldInitializeCorrectly()
    {
        var userId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();

        var item = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ItemType = WishlistItemType.Service,
            ServiceId = serviceId,
            CreatedAt = DateTime.UtcNow
        };

        item.UserId.Should().Be(userId);
        item.ItemType.Should().Be(WishlistItemType.Service);
        item.ServiceId.Should().Be(serviceId);
        item.TutorProfileId.Should().BeNull();
    }
}
