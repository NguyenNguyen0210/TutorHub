using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Admin.Categories.GetAdminTrashCategories;
using TutorHub.Application.Features.Admin.Subjects.GetAdminTrashSubjects;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin;

public class TrashQueriesHandlerTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAdminTrashCategories_ReturnsOnlyDeletedCategories()
    {
        // Arrange
        using var context = CreateContext();

        var activeCat = new Category { Id = Guid.NewGuid(), Name = "Toán Học", IsDeleted = false };
        var deletedCat1 = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Vật Lý Cổ Điển",
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow.AddDays(-2)
        };
        var deletedCat2 = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Hóa Học Hữu Cơ",
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.Categories.AddRange(activeCat, deletedCat1, deletedCat2);
        await context.SaveChangesAsync();

        var handler = new GetAdminTrashCategoriesQueryHandler(context);

        // Act
        var result = await handler.Handle(new GetAdminTrashCategoriesQuery(), CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(2);
        result.Items.Should().HaveCount(2);
        result.Items.Select(x => x.Id).Should().Contain(new[] { deletedCat1.Id, deletedCat2.Id });
        result.Items.Should().NotContain(x => x.Id == activeCat.Id);
        // Ordered by DeletedAt descending
        result.Items[0].Id.Should().Be(deletedCat2.Id);
        result.Items[1].Id.Should().Be(deletedCat1.Id);
    }

    [Fact]
    public async Task GetAdminTrashSubjects_ReturnsOnlyDeletedSubjects_WithCategoryFilter()
    {
        // Arrange
        using var context = CreateContext();

        var cat1 = new Category { Id = Guid.NewGuid(), Name = "Category 1" };
        var cat2 = new Category { Id = Guid.NewGuid(), Name = "Category 2" };

        var activeSub = new Subject { Id = Guid.NewGuid(), Name = "Active Subject", CategoryId = cat1.Id, IsDeleted = false };
        var deletedSub1 = new Subject { Id = Guid.NewGuid(), Name = "Deleted Sub 1", CategoryId = cat1.Id, IsDeleted = true, DeletedAt = DateTime.UtcNow.AddMinutes(-5) };
        var deletedSub2 = new Subject { Id = Guid.NewGuid(), Name = "Deleted Sub 2", CategoryId = cat2.Id, IsDeleted = true, DeletedAt = DateTime.UtcNow.AddMinutes(-10) };

        context.Categories.AddRange(cat1, cat2);
        context.Subjects.AddRange(activeSub, deletedSub1, deletedSub2);
        await context.SaveChangesAsync();

        var handler = new GetAdminTrashSubjectsQueryHandler(context);

        // Act 1: Get all trash subjects
        var allTrash = await handler.Handle(new GetAdminTrashSubjectsQuery(), CancellationToken.None);
        allTrash.TotalCount.Should().Be(2);
        allTrash.Items.Should().NotContain(s => s.Id == activeSub.Id);

        // Act 2: Filter by CategoryId
        var cat1Trash = await handler.Handle(new GetAdminTrashSubjectsQuery(CategoryId: cat1.Id), CancellationToken.None);
        cat1Trash.TotalCount.Should().Be(1);
        cat1Trash.Items.Single().Id.Should().Be(deletedSub1.Id);
    }
}
