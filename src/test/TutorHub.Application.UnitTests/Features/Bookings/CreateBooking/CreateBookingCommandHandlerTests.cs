using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Bookings.CreateBooking;

public class CreateBookingCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CreateBookingCommandHandler _handler;

    public CreateBookingCommandHandlerTests()
    {
        _handler = new CreateBookingCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WithPublishedService_CreatesHoldingBookingWithSnapshotTerms()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = tutorUser.Id };
        approvedApp.Approve(Guid.NewGuid());

        var category = new Category { Id = Guid.NewGuid(), Name = "Math" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", Category = category, IsActive = true };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Math 10 lessons",
            Description = "Full package",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3_500_000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        var bookingsList = new List<Booking>();

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateBookingCommand(
            UserId: studentUser.Id,
            ServiceId: service.Id
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ServiceId.Should().Be(service.Id);
        result.TotalPrice.Should().Be(3_500_000m);
        result.TotalSessions.Should().Be(10);
        result.SessionDurationMinutes.Should().Be(60);
        result.TeachingMode.Should().Be(TeachingMode.Online);
        result.Status.Should().Be(BookingStatus.Holding);
        result.HoldingExpiresAt.Should().NotBeNull();
        result.HoldingExpiresAt!.Value.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(15), TimeSpan.FromSeconds(5));

        bookingsList.Should().ContainSingle();
        var created = bookingsList.Single();
        created.ServiceId.Should().Be(service.Id);
        created.TotalPrice.Should().Be(3_500_000m);
        created.TotalSessions.Should().Be(10);
        created.Status.Should().Be(BookingStatus.Holding);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithDraftService_ThrowsBadRequestException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { IsActive = true },
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var command = new CreateBookingCommand(UserId: studentUser.Id, ServiceId: service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The selected service is not published.");
    }

    [Fact]
    public async Task Handle_WithUnpublishedService_ThrowsBadRequestException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { IsActive = true },
            Status = ServiceStatus.Unpublished
        };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var command = new CreateBookingCommand(UserId: studentUser.Id, ServiceId: service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The selected service is not published.");
    }

    [Fact]
    public async Task Handle_WithInactiveTutor_ThrowsBadRequestException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Suspended).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { IsActive = true },
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var command = new CreateBookingCommand(UserId: studentUser.Id, ServiceId: service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The selected tutor profile is not active or verified.");
    }

    [Fact]
    public async Task Handle_WithUnapprovedTutor_ThrowsBadRequestException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { IsActive = true },
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication>()).Object); // No approved app

        var command = new CreateBookingCommand(UserId: studentUser.Id, ServiceId: service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The selected tutor profile is not active or verified.");
    }

    [Fact]
    public async Task Handle_WhenStudentIsSameAsTutor_ThrowsBadRequestException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = user.Id };
        approvedApp.Approve(Guid.NewGuid());

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { IsActive = true },
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);

        var command = new CreateBookingCommand(UserId: user.Id, ServiceId: service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Tutors cannot book their own services.");
    }

    [Fact]
    public async Task Handle_WithNonExistentService_ThrowsNotFoundException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service>()).Object);

        var nonExistentServiceId = Guid.NewGuid();
        var command = new CreateBookingCommand(UserId: studentUser.Id, ServiceId: nonExistentServiceId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_CreatesStudentProfile_WhenUserIsStudentWithoutProfile()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = tutorUser.Id };
        approvedApp.Approve(Guid.NewGuid());

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { IsActive = true },
            Price = 1_000_000m,
            TotalSessions = 5,
            SessionDurationMinutes = 45,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        var studentProfilesList = new List<StudentProfile>();
        var bookingsList = new List<Booking>();

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(studentProfilesList).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { studentUser }).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateBookingCommand(UserId: studentUser.Id, ServiceId: service.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        studentProfilesList.Should().ContainSingle();
        studentProfilesList.Single().UserId.Should().Be(studentUser.Id);
    }
}
