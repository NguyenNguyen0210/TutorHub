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

    private static (Service service, StudentProfile studentProfile, TutorProfile tutorProfile, User studentUser, User tutorUser, TutorApplication tutorApp) CreateTestAggregate(
        ServiceStatus serviceStatus = ServiceStatus.Published,
        TutorApplicationStatus appStatus = TutorApplicationStatus.Approved,
        AccountStatus accountStatus = AccountStatus.Active)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .WithStatus(accountStatus)
            .Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var tutorApp = new TutorApplication { Id = Guid.NewGuid(), UserId = tutorUser.Id };
        if (appStatus == TutorApplicationStatus.Approved)
        {
            tutorApp.Approve(Guid.NewGuid());
        }
        else if (appStatus == TutorApplicationStatus.Rejected)
        {
            tutorApp.Reject("Rejection test", Guid.NewGuid());
        }

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
            Status = serviceStatus
        };

        return (service, studentProfile, tutorProfile, studentUser, tutorUser, tutorApp);
    }

    [Fact]
    public async Task Handle_WithPublishedService_CreatesHoldingBookingWithSnapshotTerms()
    {
        // Arrange
        var (service, studentProfile, tutorProfile, studentUser, _, tutorApp) = CreateTestAggregate();
        var bookingsList = new List<Booking>();

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateBookingCommand(studentUser.Id, service.Id);

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
        result.HoldingExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(15), TimeSpan.FromSeconds(5));

        bookingsList.Should().HaveCount(1);
        bookingsList[0].ServiceId.Should().Be(service.Id);
        bookingsList[0].TotalPrice.Should().Be(3_500_000m);
        bookingsList[0].TotalSessions.Should().Be(10);
        bookingsList[0].Status.Should().Be(BookingStatus.Holding);
    }

    [Fact]
    public async Task Handle_WhenServiceNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service>()).Object);

        var command = new CreateBookingCommand(studentUser.Id, Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenServiceDraftOrUnpublished_ThrowsBadRequestException()
    {
        // Arrange
        var (service, studentProfile, _, studentUser, _, tutorApp) = CreateTestAggregate(serviceStatus: ServiceStatus.Draft);

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);

        var command = new CreateBookingCommand(studentUser.Id, service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Only published services can be booked.");
    }

    [Fact]
    public async Task Handle_WhenTutorNotApproved_ThrowsBadRequestException()
    {
        // Arrange
        var (service, studentProfile, _, studentUser, _, tutorApp) = CreateTestAggregate(appStatus: TutorApplicationStatus.Pending);

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);

        var command = new CreateBookingCommand(studentUser.Id, service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The tutor offering this service is not approved.");
    }

    [Fact]
    public async Task Handle_WhenTutorUserSuspended_ThrowsForbiddenException()
    {
        // Arrange
        var (service, studentProfile, _, studentUser, _, tutorApp) = CreateTestAggregate(accountStatus: AccountStatus.Suspended);

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);

        var command = new CreateBookingCommand(studentUser.Id, service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenStudentIsTutorThemselves_ThrowsBadRequestException()
    {
        // Arrange
        var (service, _, _, _, tutorUser, tutorApp) = CreateTestAggregate();
        var tutorAsStudentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { tutorAsStudentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);

        var command = new CreateBookingCommand(tutorUser.Id, service.Id); // Self-purchase attempt!

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Tutors cannot book their own services.");
    }

    [Fact]
    public async Task Handle_WhenTutorUserBanned_ThrowsForbiddenException()
    {
        // Arrange
        var (service, studentProfile, _, studentUser, _, tutorApp) = CreateTestAggregate(accountStatus: AccountStatus.Banned);

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);

        var command = new CreateBookingCommand(studentUser.Id, service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenUserNotRegisteredStudent_CreatesStudentProfileAndProceeds()
    {
        // Arrange - User has Student role but no StudentProfile record yet
        var (service, _, tutorProfile, _, _, tutorApp) = CreateTestAggregate();
        var newUser = new UserBuilder().WithRole(UserRole.Student).Build();

        var studentProfilesList = new List<StudentProfile>();
        var bookingsList = new List<Booking>();

        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(studentProfilesList).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { newUser }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { tutorApp }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateBookingCommand(newUser.Id, service.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        studentProfilesList.Should().HaveCount(1);
        studentProfilesList[0].UserId.Should().Be(newUser.Id);
        bookingsList.Should().HaveCount(1);
        bookingsList[0].StudentProfileId.Should().Be(studentProfilesList[0].Id);
    }

    [Fact]
    public void Validator_WhenServiceIdEmpty_FailsValidation()
    {
        var validator = new CreateBookingCommandValidator();
        var command = new CreateBookingCommand(Guid.NewGuid(), Guid.Empty);
        var result = validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ServiceId");
    }

    [Fact]
    public void Validator_WhenServiceIdValid_PassesValidation()
    {
        var validator = new CreateBookingCommandValidator();
        var command = new CreateBookingCommand(Guid.NewGuid(), Guid.NewGuid());
        var result = validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }
}
