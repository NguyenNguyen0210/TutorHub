using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Application.Features.Tutors.Services.UpdateService;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly UpdateServiceCommandHandler _handler;

    public UpdateServiceCommandHandlerTests()
    {
        _handler = new UpdateServiceCommandHandler(_contextMock.Object, StubClock.Instance, _currentUser);
    }

    [Fact]
    public async Task Handle_DraftService_ShouldUpdateAllFields()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Old Title",
            Description = "Old Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 45,
            Price = 1500000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: "New Title",
            Description: "New Description",
            ShortDescription: "New short",
            Tags: new[] { "tag1", "tag2" },
            LearningScope: "Scope",
            ExpectedOutcome: "Outcome",
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            Price: 3000000m,
            TeachingMode: TeachingMode.Both,
            TrialLessonUrl: "https://example.com/trial",
            CoverImageUrl: "https://example.com/cover.png"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("New Title");
        result.ShortDescription.Should().Be("New short");
        result.Tags.Should().BeEquivalentTo("tag1", "tag2");
        result.CoverImageUrl.Should().Be("https://example.com/cover.png");
        result.TotalSessions.Should().Be(10);
        result.SessionDurationMinutes.Should().Be(60);
        result.Price.Should().Be(3000000m);
        result.TeachingMode.Should().Be("Both");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PublishedService_ShouldUpdateNonCommercialFields()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Old Title",
            Description = "Old Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: "Updated Published Title",
            Description: "Updated Published Description",
            ShortDescription: null,
            Tags: null,
            LearningScope: "Updated Scope",
            ExpectedOutcome: "Updated Outcome",
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: null
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Updated Published Title");
        result.Description.Should().Be("Updated Published Description");
        result.Price.Should().Be(3000000m);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PublishedService_ChangingPrice_ShouldThrowConflictException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: null,
            Description: null,
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: 4000000m, // Changed price
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Cannot modify commercial terms*");
    }

    [Fact]
    public async Task Handle_PublishedService_ChangingShowcaseFields_ShouldThrowConflictException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: null,
            Description: null,
            ShortDescription: "New short",
            Tags: new[] { "new-tag" },
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: "https://example.com/new-cover.png"
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*showcase fields*");
    }

    [Fact]
    public async Task Handle_DraftService_WithCurriculumContent_ShouldPersistJsonAndReturnParsedDto()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Old Title",
            Description = "Old Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 45,
            Price = 1500000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: null,
            Description: null,
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: null,
            Curriculum: new List<CurriculumItemInput>
            {
                new(SessionIndex: 1, Title: "Foundations", KeyTopics: new List<string> { "Basics" })
            },
            TargetAudience: new List<string> { "Beginners" },
            Prerequisites: new List<string> { "None" },
            Faqs: new List<FaqInput> { new(Question: "How long?", Answer: "5 sessions.") }
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert: omitted per-session duration defaults to the service's 45 minutes
        result.Curriculum.Should().HaveCount(1);
        result.Curriculum[0].SessionIndex.Should().Be(1);
        result.Curriculum[0].Title.Should().Be("Foundations");
        result.Curriculum[0].DurationMinutes.Should().Be(45);
        result.TargetAudience.Should().BeEquivalentTo("Beginners");
        result.Prerequisites.Should().BeEquivalentTo("None");
        result.Faqs.Should().HaveCount(1);

        service.CurriculumJson.Should().NotBeNullOrWhiteSpace();
        service.TargetAudienceJson.Should().NotBeNullOrWhiteSpace();
        service.PrerequisitesJson.Should().NotBeNullOrWhiteSpace();
        service.FaqsJson.Should().NotBeNullOrWhiteSpace();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PublishedService_UpdatingMarketingContent_ShouldSucceed()
    {
        // Arrange: curriculum/audience/prereqs/faqs follow Description's rule —
        // editable while Published (only commercial terms + showcase fields lock).
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: null,
            Description: null,
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: null,
            Curriculum: new List<CurriculumItemInput> { new(SessionIndex: 1, Title: "Updated session") },
            TargetAudience: new List<string> { "Everyone" },
            Prerequisites: new List<string> { "None" },
            Faqs: new List<FaqInput> { new(Question: "Q?", Answer: "A.") }
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Curriculum.Should().HaveCount(1);
        result.TargetAudience.Should().BeEquivalentTo("Everyone");
        result.Faqs.Should().HaveCount(1);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_CurriculumExceedingTotalSessions_ShouldThrowBadRequestException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 2,
            SessionDurationMinutes = 60,
            Price = 1000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: null,
            Description: null,
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: null,
            Curriculum: new List<CurriculumItemInput>
            {
                new(SessionIndex: 1, Title: "One"),
                new(SessionIndex: 2, Title: "Two"),
                new(SessionIndex: 3, Title: "Three")
            }
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_NotOwner_ShouldThrowForbiddenException()
    {
        // Arrange
        var owner = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = owner.Id, User = owner };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var differentUserId = Guid.NewGuid();
        _currentUser.Set(differentUserId, UserRole.Tutor);
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            Title: "New Title",
            Description: null,
            ShortDescription: null,
            Tags: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
