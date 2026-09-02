using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.CreateService;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.CreateService;

public class CreateServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CreateServiceCommandHandler _handler;

    public CreateServiceCommandHandlerTests()
    {
        _handler = new CreateServiceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldCreateDraftService()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = "Math tutor",
            Education = "B.Sc",
            ExperienceYears = 3,
            TeachingMode = TeachingMode.Both
        };

        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category, IsActive = true };

        var tutorSubject = new TutorSubject
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            SubjectId = subject.Id,
            Subject = subject,
            IsActive = true
        };

        var approvedApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id
        };
        approvedApp.Approve(Guid.NewGuid());

        var servicesList = new List<Service>();

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.TutorSubjects).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorSubject> { tutorSubject }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(servicesList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateServiceCommand(
            UserId: user.Id,
            SubjectId: subject.Id,
            Title: "Comprehensive Algebra 101",
            Description: "10 structured lessons covering high school algebra.",
            LearningScope: "Equations, Inequalities, Functions",
            ExpectedOutcome: "Master algebra exams",
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            Price: 3500000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: "https://example.com/trial"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Comprehensive Algebra 101");
        result.SubjectName.Should().Be("Algebra");
        result.SubjectCategoryName.Should().Be("Mathematics");
        result.TotalSessions.Should().Be(10);
        result.SessionDurationMinutes.Should().Be(60);
        result.Price.Should().Be(3500000m);
        result.Status.Should().Be(ServiceStatus.Draft.ToString());

        servicesList.Should().ContainSingle();
        var created = servicesList.Single();
        created.Status.Should().Be(ServiceStatus.Draft);
        created.TutorProfileId.Should().Be(tutorProfile.Id);
        created.SubjectId.Should().Be(subject.Id);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ProfileNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile>()).Object);

        var command = new CreateServiceCommand(
            UserId: Guid.NewGuid(),
            SubjectId: Guid.NewGuid(),
            Title: "Title",
            Description: "Desc",
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_TutorNotApproved_ShouldThrowForbiddenException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication>()).Object);

        var command = new CreateServiceCommand(
            UserId: user.Id,
            SubjectId: Guid.NewGuid(),
            Title: "Title",
            Description: "Desc",
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("Only approved tutors can create services.");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_SubjectNotInTutorSubjects_ShouldThrowBadRequestException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id };
        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = user.Id };
        approvedApp.Approve(Guid.NewGuid());

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.TutorSubjects).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorSubject>()).Object);

        var command = new CreateServiceCommand(
            UserId: user.Id,
            SubjectId: Guid.NewGuid(),
            Title: "Title",
            Description: "Desc",
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The selected subject is not registered or active in your teaching subjects list.");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
