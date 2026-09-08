using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.GetTutorServices;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.GetTutorServices;

public class GetTutorServicesQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetTutorServicesQueryHandler _handler;

    public GetTutorServicesQueryHandlerTests()
    {
        _handler = new GetTutorServicesQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ApprovedTutor_ShouldReturnOnlyPublishedServices()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var publishedService = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Published Course",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published,
            CreatedAt = DateTime.UtcNow
        };

        var draftService = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Draft Course",
            TotalSessions = 5,
            SessionDurationMinutes = 45,
            Price = 1000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = user.Id };
        approvedApp.Approve(Guid.NewGuid());

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { publishedService, draftService }).Object);

        var query = new GetTutorServicesQuery(tutorProfile.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.Single().Title.Should().Be("Published Course");
    }

    [Fact]
    public async Task Handle_TutorNotFoundOrNotActive_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile>()).Object);

        var query = new GetTutorServicesQuery(Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
