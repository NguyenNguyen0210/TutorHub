using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Infrastructure;

public class AppDbContextSoftDeleteTests
{
    private static AppDbContext CreateContext(Guid? currentUserId = null, DateTime? utcNow = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserService = new StubCurrentUserService();
        if (currentUserId.HasValue)
        {
            currentUserService.Set(currentUserId.Value);
        }
        else
        {
            currentUserService.Set(null, isAuthenticated: false);
        }

        var clock = new StubClock(utcNow ?? DateTime.UtcNow);

        return new AppDbContext(options, currentUserService, clock);
    }

    [Fact]
    public async Task Remove_Category_ConvertsToSoftDeleteWithAuditFields()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fixedTime = new DateTime(2026, 10, 26, 12, 0, 0, DateTimeKind.Utc);
        using var context = CreateContext(userId, fixedTime);

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Khoa Học Tự Nhiên",
            IsActive = true
        };
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        // Act: Issue EF Remove
        context.Categories.Remove(category);
        await context.SaveChangesAsync();

        // Assert: Row still exists in DB, but flagged as deleted
        var rawCategory = await context.Categories
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == category.Id);

        rawCategory.Should().NotBeNull();
        rawCategory!.IsDeleted.Should().BeTrue();
        rawCategory.DeletedAt.Should().Be(fixedTime);
        rawCategory.DeletedByUserId.Should().Be(userId);

        // Assert: Excluded by Global Query Filter
        var activeCategory = await context.Categories
            .FirstOrDefaultAsync(c => c.Id == category.Id);
        activeCategory.Should().BeNull();
    }

    [Fact]
    public async Task Query_Categories_ExcludesSoftDeletedByDefault()
    {
        // Arrange
        using var context = CreateContext();

        var activeCat = new Category { Id = Guid.NewGuid(), Name = "Active Category", IsDeleted = false };
        var deletedCat = new Category { Id = Guid.NewGuid(), Name = "Deleted Category", IsDeleted = true, DeletedAt = DateTime.UtcNow };

        context.Categories.AddRange(activeCat, deletedCat);
        await context.SaveChangesAsync();

        // Act & Assert
        var visibleCategories = await context.Categories.ToListAsync();
        visibleCategories.Should().ContainSingle(c => c.Id == activeCat.Id);
        visibleCategories.Should().NotContain(c => c.Id == deletedCat.Id);

        var allCategories = await context.Categories.IgnoreQueryFilters().ToListAsync();
        allCategories.Should().HaveCount(2);
    }

    [Fact]
    public async Task Remove_Subject_ConvertsToSoftDeleteWithAuditFields()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fixedTime = new DateTime(2026, 10, 26, 12, 0, 0, DateTimeKind.Utc);
        using var context = CreateContext(userId, fixedTime);

        var category = new Category { Id = Guid.NewGuid(), Name = "Ngoại Ngữ" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Tiếng Anh", CategoryId = category.Id };
        context.Categories.Add(category);
        context.Subjects.Add(subject);
        await context.SaveChangesAsync();

        // Act: Issue EF Remove
        context.Subjects.Remove(subject);
        await context.SaveChangesAsync();

        // Assert: Filtered out normally
        var activeSubject = await context.Subjects.FirstOrDefaultAsync(s => s.Id == subject.Id);
        activeSubject.Should().BeNull();

        // Assert: Retrievable via IgnoreQueryFilters
        var rawSubject = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == subject.Id);
        rawSubject.Should().NotBeNull();
        rawSubject!.IsDeleted.Should().BeTrue();
        rawSubject.DeletedAt.Should().Be(fixedTime);
        rawSubject.DeletedByUserId.Should().Be(userId);
    }

    [Fact]
    public async Task Remove_Service_ConvertsToSoftDeleteWithAuditFields()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fixedTime = new DateTime(2026, 10, 26, 12, 0, 0, DateTimeKind.Utc);
        using var context = CreateContext(userId, fixedTime);

        var service = new Service
        {
            Id = Guid.NewGuid(),
            Title = "IELTS 7.0 Masterclass",
            Description = "Comprehensive IELTS preparation",
            TutorProfileId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid()
        };
        context.Services.Add(service);
        await context.SaveChangesAsync();

        // Act
        context.Services.Remove(service);
        await context.SaveChangesAsync();

        // Assert
        var active = await context.Services.FirstOrDefaultAsync(s => s.Id == service.Id);
        active.Should().BeNull();

        var raw = await context.Services.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == service.Id);
        raw.Should().NotBeNull();
        raw!.IsDeleted.Should().BeTrue();
        raw.DeletedAt.Should().Be(fixedTime);
        raw.DeletedByUserId.Should().Be(userId);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenDeletingWallet_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateContext();
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            AvailableBalance = 0m,
            CreatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);
        await context.SaveChangesAsync();

        // Act
        context.Wallets.Remove(wallet);

        // Assert
        var act = () => context.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Wallet*cannot be deleted*");
    }
}
