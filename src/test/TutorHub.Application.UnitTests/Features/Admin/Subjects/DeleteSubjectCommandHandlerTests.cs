using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Subjects.DeleteSubject;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Subjects;

public class DeleteSubjectCommandHandlerTests
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
        var handler = new DeleteSubjectCommandHandler(context, currentUser, auditLogMock.Object);

        var act = () => handler.Handle(new DeleteSubjectCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenSubjectHasTutors_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Hóa 11", CategoryId = Guid.NewGuid() };
        var tutorSubject = new TutorSubject { TutorProfileId = Guid.NewGuid(), SubjectId = subject.Id };

        context.Subjects.Add(subject);
        context.TutorSubjects.Add(tutorSubject);
        await context.SaveChangesAsync();

        var handler = new DeleteSubjectCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new DeleteSubjectCommand(subject.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*referenced by one or more tutors*");
    }

    [Fact]
    public async Task Handle_WhenSubjectHasActiveBookings_ThrowsConflictException()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Sinh 12", CategoryId = Guid.NewGuid() };
        var activeBooking = new Booking
        {
            Id = Guid.NewGuid(),
            SubjectId = subject.Id,
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            Status = BookingStatus.Paid
        };

        context.Subjects.Add(subject);
        context.Bookings.Add(activeBooking);
        await context.SaveChangesAsync();

        var handler = new DeleteSubjectCommandHandler(context, currentUser, auditLogMock.Object);
        var act = () => handler.Handle(new DeleteSubjectCommand(subject.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*active bookings*");
    }

    [Fact]
    public async Task Handle_WhenValid_SoftDeletesSubjectSuccessfully()
    {
        var (context, currentUser, auditLogMock) = CreateTestEnv();
        var adminId = currentUser.UserId!.Value;
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Địa Lý 10", CategoryId = Guid.NewGuid() };

        // Booking is cancelled, so should not block deletion
        var cancelledBooking = new Booking
        {
            Id = Guid.NewGuid(),
            SubjectId = subject.Id,
            StudentProfileId = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            Status = BookingStatus.Cancelled
        };

        context.Subjects.Add(subject);
        context.Bookings.Add(cancelledBooking);
        await context.SaveChangesAsync();

        var handler = new DeleteSubjectCommandHandler(context, currentUser, auditLogMock.Object);
        var command = new DeleteSubjectCommand(subject.Id);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert: Filtered out from active
        var active = await context.Subjects.FirstOrDefaultAsync(s => s.Id == subject.Id);
        active.Should().BeNull();

        // Assert: Present in trash
        var raw = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == subject.Id);
        raw.Should().NotBeNull();
        raw!.IsDeleted.Should().BeTrue();
        raw.DeletedByUserId.Should().Be(adminId);

        // Assert: Audit log
        auditLogMock.Verify(a => a.LogAsync(
            "SUBJECT_SOFT_DELETED",
            "Subject",
            subject.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
