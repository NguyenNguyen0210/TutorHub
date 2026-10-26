using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Subjects.RestoreSubject;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Subjects;

public class RestoreSubjectCommandHandlerTests
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
    public async Task Handle_WhenSubjectNotFound_ThrowsNotFoundException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var handler = new RestoreSubjectCommandHandler(context, currentUser, auditLogMock.Object);

        var act = () => handler.Handle(new RestoreSubjectCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenSubjectNotDeleted_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var category = new Category { Id = Guid.NewGuid(), Name = "Toán Học" };
        var activeSubject = new Subject { Id = Guid.NewGuid(), Name = "Toán 12", CategoryId = category.Id, IsDeleted = false };

        context.Categories.Add(category);
        context.Subjects.Add(activeSubject);
        await context.SaveChangesAsync();

        var handler = new RestoreSubjectCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new RestoreSubjectCommand(activeSubject.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*not in trash*");
    }

    [Fact]
    public async Task Handle_WhenParentCategoryIsDeleted_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();

        var deletedCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Toán Học",
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };
        var deletedSubject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Hình Học 11",
            CategoryId = deletedCategory.Id,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };

        context.Categories.Add(deletedCategory);
        context.Subjects.Add(deletedSubject);
        await context.SaveChangesAsync();

        var handler = new RestoreSubjectCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new RestoreSubjectCommand(deletedSubject.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*parent category is currently deleted*");
    }

    [Fact]
    public async Task Handle_WhenDuplicateActiveNameExistsInSameCategory_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();

        var activeCategory = new Category { Id = Guid.NewGuid(), Name = "Toán Học", IsDeleted = false };
        var deletedSubject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Giải Tích 12",
            CategoryId = activeCategory.Id,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };
        var activeDuplicateSubject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Giải Tích 12",
            CategoryId = activeCategory.Id,
            IsDeleted = false
        };

        context.Categories.Add(activeCategory);
        context.Subjects.AddRange(deletedSubject, activeDuplicateSubject);
        await context.SaveChangesAsync();

        var handler = new RestoreSubjectCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new RestoreSubjectCommand(deletedSubject.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already exists in this category*");
    }

    [Fact]
    public async Task Handle_WhenValid_RestoresSubjectAndLogsAudit()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var adminId = currentUser.UserId!.Value;

        var activeCategory = new Category { Id = Guid.NewGuid(), Name = "Khoa Học", IsDeleted = false };
        var deletedSubject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Sinh Học 10",
            CategoryId = activeCategory.Id,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow,
            DeletedByUserId = adminId,
            DeleteReason = "Temporary",
            IsActive = false
        };

        context.Categories.Add(activeCategory);
        context.Subjects.Add(deletedSubject);
        await context.SaveChangesAsync();

        var handler = new RestoreSubjectCommandHandler(context, currentUser, auditLogMock.Object);

        // Act
        var result = await handler.Handle(new RestoreSubjectCommand(deletedSubject.Id), CancellationToken.None);

        // Assert DTO
        result.Should().NotBeNull();
        result.Id.Should().Be(deletedSubject.Id);
        result.IsDeleted.Should().BeFalse();
        result.CategoryName.Should().Be("Khoa Học");

        // Assert DB
        var restored = await context.Subjects.FirstOrDefaultAsync(s => s.Id == deletedSubject.Id);
        restored.Should().NotBeNull();
        restored!.IsDeleted.Should().BeFalse();
        restored.DeletedAt.Should().BeNull();
        restored.DeleteReason.Should().BeNull();

        // Assert Audit Log
        auditLogMock.Verify(a => a.LogAsync(
            "SUBJECT_RESTORED",
            "Subject",
            deletedSubject.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
