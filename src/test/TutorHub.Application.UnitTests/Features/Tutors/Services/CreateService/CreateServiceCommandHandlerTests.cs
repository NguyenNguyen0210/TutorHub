using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.CreateService;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.CreateService;

public class CreateServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly CreateServiceCommandHandler _handler;

    public CreateServiceCommandHandlerTests()
    {
        _handler = new CreateServiceCommandHandler(_contextMock.Object, StubClock.Instance, _currentUser);
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

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new CreateServiceCommand(
            SubjectId: subject.Id,
            Title: "Comprehensive Algebra 101",
            Description: "10 structured lessons covering high school algebra.",
            ShortDescription: "Algebra in 10 lessons",
            Tags: new[] { "algebra", "exam-prep" },
            LearningScope: "Equations, Inequalities, Functions",
            ExpectedOutcome: "Master algebra exams",
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            Price: 3500000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: "https://example.com/trial",
            CoverImageUrl: "https://example.com/cover.png"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Comprehensive Algebra 101");
        result.ShortDescription.Should().Be("Algebra in 10 lessons");
        result.Tags.Should().BeEquivalentTo("algebra", "exam-prep");
        result.CoverImageUrl.Should().Be("https://example.com/cover.png");
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
    public async Task Handle_WithCurriculumContent_ShouldPersistJsonAndReturnParsedDto()
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

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new CreateServiceCommand(
            SubjectId: subject.Id,
            Title: "Comprehensive Algebra 101",
            Description: "10 structured lessons covering high school algebra.",
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            Price: 3500000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null,
            CoverImageUrl: null,
            Curriculum: new List<CurriculumItemInput>
            {
                new(SessionIndex: 1, Title: "Foundations", Description: "Core concepts.",
                    KeyTopics: new List<string> { "Variables", "Equations" }, DurationMinutes: 90),
                // Omitted duration defaults to the service's session length (60).
                new(SessionIndex: 2, Title: "Practice")
            },
            TargetAudience: new List<string> { "Beginners", "Exam takers" },
            Prerequisites: new List<string> { "Basic arithmetic" },
            Faqs: new List<FaqInput> { new(Question: "Is this suitable for beginners?", Answer: "Yes.") }
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert: parsed DTO out (round-trip through the stored JSON)
        result.Curriculum.Should().HaveCount(2);
        result.Curriculum[0].Should().BeEquivalentTo(new
        {
            SessionIndex = 1,
            Title = "Foundations",
            Description = "Core concepts.",
            DurationMinutes = 90
        });
        result.Curriculum[0].KeyTopics.Should().BeEquivalentTo("Variables", "Equations");
        result.Curriculum[1].DurationMinutes.Should().Be(60);
        result.TargetAudience.Should().BeEquivalentTo("Beginners", "Exam takers");
        result.Prerequisites.Should().BeEquivalentTo("Basic arithmetic");
        result.Faqs.Should().HaveCount(1);
        result.Faqs[0].Question.Should().Be("Is this suitable for beginners?");
        result.Faqs[0].Answer.Should().Be("Yes.");

        var created = servicesList.Should().ContainSingle().Subject;
        created.CurriculumJson.Should().NotBeNullOrWhiteSpace();
        created.TargetAudienceJson.Should().NotBeNullOrWhiteSpace();
        created.PrerequisitesJson.Should().NotBeNullOrWhiteSpace();
        created.FaqsJson.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Handle_WithoutContent_ShouldReturnEmptyContentLists()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id };
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
        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = user.Id };
        approvedApp.Approve(Guid.NewGuid());
        var servicesList = new List<Service>();

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.TutorSubjects).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorSubject> { tutorSubject }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(servicesList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new CreateServiceCommand(
            SubjectId: subject.Id,
            Title: "Title",
            Description: "Desc",
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null,
            CoverImageUrl: null
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Curriculum.Should().BeEmpty();
        result.TargetAudience.Should().BeEmpty();
        result.Prerequisites.Should().BeEmpty();
        result.Faqs.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ProfileNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile>()).Object);

        _currentUser.Set(Guid.NewGuid(), UserRole.Tutor);
        var command = new CreateServiceCommand(
            SubjectId: Guid.NewGuid(),
            Title: "Title",
            Description: "Desc",
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null,
            CoverImageUrl: null
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

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new CreateServiceCommand(
            SubjectId: Guid.NewGuid(),
            Title: "Title",
            Description: "Desc",
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null,
            CoverImageUrl: null
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

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new CreateServiceCommand(
            SubjectId: Guid.NewGuid(),
            Title: "Title",
            Description: "Desc",
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 5,
            SessionDurationMinutes: 60,
            Price: 1000000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null,
            CoverImageUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The selected subject is not registered or active in your teaching subjects list.");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
