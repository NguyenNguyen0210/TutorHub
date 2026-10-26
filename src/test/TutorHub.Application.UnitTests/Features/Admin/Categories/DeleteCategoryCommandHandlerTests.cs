using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Categories.DeleteCategory;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Categories;

public class DeleteCategoryCommandHandlerTests
{
    private static (AppDbContext Context, StubCurrentUserService CurrentUser, Mock<IAuditLogService> AuditLogMock) CreateTestEnv()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUser = new StubCurrentUserService();
        currentUser.Set(Guid.NewGuid());
        var clock = StubClock.Instance;
        var auditLogMock = new Mock<IAuditLogService>();

        var context = new AppDbContext(options, currentUser, clock);
        return (context, currentUser, auditLogMock);
    }

    [Fact]
    public async Task Handle_WhenCategoryNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var handler = new DeleteCategoryCommandHandler(context, currentUser, auditLogMock.Object);
        var command = new DeleteCategoryCommand(Guid.NewGuid(), "Obsolete");

        // Act
        var act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenCategoryContainsActiveSubjects_ThrowsConflictException()
    {
        // Arrange
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa Học" };
        var activeSubject = new Subject { Id = Guid.NewGuid(), Name = "Vật Lý", CategoryId = category.Id, IsDeleted = false };
        category.Subjects.Add(activeSubject);

        context.Categories.Add(category);
        context.Subjects.Add(activeSubject);
        await context.SaveChangesAsync();

        var handler = new DeleteCategoryCommandHandler(context, currentUser, auditLogMock.Object);
        var command = new DeleteCategoryCommand(category.Id, "Delete reason");

        // Act
        var act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*contains active subjects*");
    }

    [Fact]
    public async Task Handle_WhenCategoryContainsOnlyDeletedSubjects_SoftDeletesCategorySuccessfully()
    {
        // Arrange
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var adminId = currentUser.UserId!.Value;
        var category = new Category { Id = Guid.NewGuid(), Name = "Lịch Sử" };
        var deletedSubject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Sử Cổ Đại",
            CategoryId = category.Id,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };
        category.Subjects.Add(deletedSubject);

        context.Categories.Add(category);
        context.Subjects.Add(deletedSubject);
        await context.SaveChangesAsync();

        var handler = new DeleteCategoryCommandHandler(context, currentUser, auditLogMock.Object);
        var command = new DeleteCategoryCommand(category.Id, "Out of syllabus");

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert: Excluded from active categories
        var active = await context.Categories.FirstOrDefaultAsync(c => c.Id == category.Id);
        active.Should().BeNull();

        // Assert: Present in trash
        var raw = await context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == category.Id);
        raw.Should().NotBeNull();
        raw!.IsDeleted.Should().BeTrue();
        raw.DeletedByUserId.Should().Be(adminId);
        raw.DeleteReason.Should().Be("Out of syllabus");

        // Assert: Audit log recorded
        auditLogMock.Verify(a => a.LogAsync(
            "CATEGORY_SOFT_DELETED",
            "Category",
            category.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
