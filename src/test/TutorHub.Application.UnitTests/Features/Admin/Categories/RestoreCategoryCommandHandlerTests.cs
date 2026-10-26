using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Categories.RestoreCategory;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Categories;

public class RestoreCategoryCommandHandlerTests
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
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var handler = new RestoreCategoryCommandHandler(context, currentUser, auditLogMock.Object);

        var act = () => handler.Handle(new RestoreCategoryCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenCategoryNotDeleted_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var activeCategory = new Category { Id = Guid.NewGuid(), Name = "Toán Học", IsDeleted = false };
        context.Categories.Add(activeCategory);
        await context.SaveChangesAsync();

        var handler = new RestoreCategoryCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new RestoreCategoryCommand(activeCategory.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*not in trash*");
    }

    [Fact]
    public async Task Handle_WhenDuplicateActiveNameExists_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();

        // One deleted category named "Vật Lý"
        var deletedCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Vật Lý",
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };

        // Another active category created later with the same name "Vật Lý"
        var activeCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Vật Lý",
            IsDeleted = false
        };

        context.Categories.AddRange(deletedCategory, activeCategory);
        await context.SaveChangesAsync();

        var handler = new RestoreCategoryCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new RestoreCategoryCommand(deletedCategory.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task Handle_WhenValid_RestoresCategoryAndLogsAudit()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var adminId = currentUser.UserId!.Value;

        var deletedCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Hóa Học",
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow,
            DeletedByUserId = adminId,
            DeleteReason = "Temporary",
            IsActive = false
        };
        context.Categories.Add(deletedCategory);
        await context.SaveChangesAsync();

        var handler = new RestoreCategoryCommandHandler(context, currentUser, auditLogMock.Object);

        // Act
        var result = await handler.Handle(new RestoreCategoryCommand(deletedCategory.Id), CancellationToken.None);

        // Assert DTO
        result.Should().NotBeNull();
        result.Id.Should().Be(deletedCategory.Id);
        result.IsDeleted.Should().BeFalse();
        result.IsActive.Should().BeTrue();

        // Assert DB state
        var restored = await context.Categories.FirstOrDefaultAsync(c => c.Id == deletedCategory.Id);
        restored.Should().NotBeNull();
        restored!.IsDeleted.Should().BeFalse();
        restored.DeletedAt.Should().BeNull();
        restored.DeleteReason.Should().BeNull();

        // Assert Audit Log
        auditLogMock.Verify(a => a.LogAsync(
            "CATEGORY_RESTORED",
            "Category",
            deletedCategory.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
