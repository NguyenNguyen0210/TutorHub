using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.GetMe;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.GetMe;

public class GetMeQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly GetMeQueryHandler _handler;

    public GetMeQueryHandlerTests()
    {
        _handler = new GetMeQueryHandler(_contextMock.Object, _currentUser);
    }

    [Theory]
    [InlineData(UserRole.Student)]
    [InlineData(UserRole.Tutor)]
    [InlineData(UserRole.Admin)]
    public async Task Handle_ShouldReturnGetMeResponseDto_WhenUserExists(UserRole role)
    {
        // Arrange
        var user = new UserBuilder()
            .WithFullName("Profile Owner")
            .WithEmail("owner@example.com")
            .WithPhone("0123456789")
            .WithRole(role)
            .Build();
        user.AvatarUrl = "https://example.com/avatar.jpg";

        var usersList = new List<User> { user };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _currentUser.Set(user.Id, role);

        var query = new GetMeQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(user.Id);
        result.UserId.Should().Be(user.Id);
        result.Email.Should().Be("owner@example.com");
        result.FullName.Should().Be("Profile Owner");
        result.Phone.Should().Be("0123456789");
        result.Role.Should().Be(role.ToString());
        result.Status.Should().Be(user.Status.ToString());
        result.AvatarUrl.Should().Be("https://example.com/avatar.jpg");
    }

    [Fact]
    public async Task Handle_ShouldReturnTutorProfileId_WhenUserIsTutor()
    {
        // Arrange
        var tutorProfileId = Guid.NewGuid();
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .WithTutorProfile(new TutorProfile { Id = tutorProfileId })
            .Build();

        var usersList = new List<User> { user };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(new GetMeQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IdProfile.Should().Be(tutorProfileId);
    }

    [Fact]
    public async Task Handle_ShouldReturnStudentProfileId_WhenUserIsStudent()
    {
        // Arrange
        var studentProfileId = Guid.NewGuid();
        var user = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStudentProfile(new StudentProfile { Id = studentProfileId })
            .Build();

        var usersList = new List<User> { user };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _currentUser.Set(user.Id, UserRole.Student);

        // Act
        var result = await _handler.Handle(new GetMeQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IdProfile.Should().Be(studentProfileId);
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenUserDoesNotExist()
    {
        // Arrange
        var usersList = new List<User>();
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _currentUser.Set(Guid.NewGuid(), UserRole.Student);

        var query = new GetMeQuery();

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
