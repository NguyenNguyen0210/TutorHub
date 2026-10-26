using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class SoftDeleteEntityTests
{
    [Fact]
    public void Category_SoftDelete_SetsPropertiesAndDeactivates()
    {
        // Arrange
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Toán Học",
            IsActive = true
        };
        var adminId = Guid.NewGuid();

        // Act
        category.SoftDelete(adminId);

        // Assert
        category.IsDeleted.Should().BeTrue();
        category.DeletedAt.Should().NotBeNull();
        category.DeletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        category.DeletedByUserId.Should().Be(adminId);
        category.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Category_SoftDelete_WhenAlreadyDeleted_IsIdempotent()
    {
        // Arrange
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Toán Học",
            IsActive = true
        };
        var adminId1 = Guid.NewGuid();
        category.SoftDelete(adminId1);
        var originalDeletedAt = category.DeletedAt;

        // Act
        var adminId2 = Guid.NewGuid();
        category.SoftDelete(adminId2);

        // Assert: preserves first deletion audit values
        category.DeletedByUserId.Should().Be(adminId1);
        category.DeletedAt.Should().Be(originalDeletedAt);
    }

    [Fact]
    public void Category_Restore_ResetsAuditPropertiesAndActivates()
    {
        // Arrange
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Toán Học",
            IsActive = true
        };
        category.SoftDelete(Guid.NewGuid());

        // Act
        category.Restore();

        // Assert
        category.IsDeleted.Should().BeFalse();
        category.DeletedAt.Should().BeNull();
        category.DeletedByUserId.Should().BeNull();
        category.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Subject_SoftDelete_And_Restore_WorkAsExpected()
    {
        // Arrange
        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Đại số 10",
            CategoryId = Guid.NewGuid(),
            IsActive = true
        };
        var adminId = Guid.NewGuid();

        // Act - Soft Delete
        subject.SoftDelete(adminId);

        // Assert
        subject.IsDeleted.Should().BeTrue();
        subject.DeletedAt.Should().NotBeNull();
        subject.DeletedByUserId.Should().Be(adminId);
        subject.IsActive.Should().BeFalse();

        // Act - Restore
        subject.Restore();

        // Assert
        subject.IsDeleted.Should().BeFalse();
        subject.DeletedAt.Should().BeNull();
        subject.DeletedByUserId.Should().BeNull();
        subject.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Service_SoftDelete_And_Restore_WorkAsExpected()
    {
        // Arrange
        var service = new Service
        {
            Id = Guid.NewGuid(),
            Title = "Gia sư Toán 10",
            TutorProfileId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            Status = ServiceStatus.Published
        };
        var adminId = Guid.NewGuid();

        // Act - Soft Delete
        service.SoftDelete(adminId);

        // Assert
        service.IsDeleted.Should().BeTrue();
        service.DeletedAt.Should().NotBeNull();
        service.DeletedByUserId.Should().Be(adminId);
        service.Status.Should().Be(ServiceStatus.Unpublished);

        // Act - Restore
        service.Restore();

        // Assert
        service.IsDeleted.Should().BeFalse();
        service.DeletedAt.Should().BeNull();
        service.DeletedByUserId.Should().BeNull();
    }
}
