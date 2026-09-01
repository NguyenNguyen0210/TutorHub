using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.SubmitTutorApplication;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.SubmitTutorApplication;

public class SubmitTutorApplicationCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly SubmitTutorApplicationCommandHandler _handler;

    public SubmitTutorApplicationCommandHandlerTests()
    {
        _handler = new SubmitTutorApplicationCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ValidFirstApplication_ShouldCreatePendingApplication()
    {
        // Arrange
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .WithStatus(AccountStatus.Active)
            .Build();

        var usersList = new List<User> { user };
        var applicationsList = new List<TutorApplication>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitTutorApplicationCommand(
            UserId: user.Id,
            Bio: "Experienced Math tutor with 5 years experience.",
            Education: "B.Sc. Mathematics",
            ExperienceYears: 5,
            TeachingMode: TeachingMode.Both,
            Address: "123 Main St",
            Latitude: 10.762622,
            Longitude: 106.660172
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(TutorApplicationStatus.Pending.ToString());
        result.Bio.Should().Be("Experienced Math tutor with 5 years experience.");
        result.Education.Should().Be("B.Sc. Mathematics");
        result.ExperienceYears.Should().Be(5);
        result.TeachingMode.Should().Be("Both");

        applicationsList.Should().ContainSingle();
        var created = applicationsList.Single();
        created.UserId.Should().Be(user.Id);
        created.Status.Should().Be(TutorApplicationStatus.Pending);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_AfterRejection_ShouldCreateNewPendingApplication()
    {
        // Arrange
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .WithStatus(AccountStatus.Active)
            .Build();

        var oldRejectedApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = "Old bio",
            Education = "Old edu",
            ExperienceYears = 1,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow.AddDays(-10)
        };
        oldRejectedApp.Reject("Insufficient experience details", Guid.NewGuid());

        var usersList = new List<User> { user };
        var applicationsList = new List<TutorApplication> { oldRejectedApp };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitTutorApplicationCommand(
            UserId: user.Id,
            Bio: "Updated comprehensive bio with 3 years experience.",
            Education: "B.Sc. Computer Science",
            ExperienceYears: 3,
            TeachingMode: TeachingMode.Online
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(TutorApplicationStatus.Pending.ToString());

        // Should preserve old rejected application and add a new pending one (history audit)
        applicationsList.Should().HaveCount(2);
        oldRejectedApp.Status.Should().Be(TutorApplicationStatus.Rejected);
        oldRejectedApp.RejectionReason.Should().Be("Insufficient experience details");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var usersList = new List<User>();
        var applicationsList = new List<TutorApplication>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new SubmitTutorApplicationCommand(
            UserId: Guid.NewGuid(),
            Bio: "Bio",
            Education: "Edu",
            ExperienceYears: 2,
            TeachingMode: TeachingMode.Online
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_UserNotTutorRole_ShouldThrowBadRequestException()
    {
        // Arrange
        var user = new UserBuilder()
            .WithRole(UserRole.Student)
            .Build();

        var usersList = new List<User> { user };
        var applicationsList = new List<TutorApplication>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new SubmitTutorApplicationCommand(
            UserId: user.Id,
            Bio: "Bio",
            Education: "Edu",
            ExperienceYears: 2,
            TeachingMode: TeachingMode.Online
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Only users with the Tutor role can submit a Tutor application.");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ExistingPendingApplication_ShouldThrowConflictException()
    {
        // Arrange
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .Build();

        var pendingApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = "Pending bio",
            Education = "Pending edu",
            ExperienceYears = 1,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };

        var usersList = new List<User> { user };
        var applicationsList = new List<TutorApplication> { pendingApp };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new SubmitTutorApplicationCommand(
            UserId: user.Id,
            Bio: "Another bio",
            Education: "Another edu",
            ExperienceYears: 2,
            TeachingMode: TeachingMode.Online
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*already have a pending application*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ExistingApprovedApplication_ShouldThrowConflictException()
    {
        // Arrange
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .Build();

        var approvedApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = "Approved bio",
            Education = "Approved edu",
            ExperienceYears = 5,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow.AddDays(-20)
        };
        approvedApp.Approve(Guid.NewGuid());

        var usersList = new List<User> { user };
        var applicationsList = new List<TutorApplication> { approvedApp };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new SubmitTutorApplicationCommand(
            UserId: user.Id,
            Bio: "New bio",
            Education: "New edu",
            ExperienceYears: 6,
            TeachingMode: TeachingMode.Online
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*already been approved*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
