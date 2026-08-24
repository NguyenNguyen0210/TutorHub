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
    private readonly GetMeQueryHandler _handler;

    public GetMeQueryHandlerTests()
    {
        _handler = new GetMeQueryHandler(_contextMock.Object);
    }

    [Theory]
    [InlineData(UserRole.Student)]
    [InlineData(UserRole.Tutor)]
    [InlineData(UserRole.Admin)]
    public async Task Handle_ShouldReturnUserDto_WhenUserExists(UserRole role)
    {
        // Arrange
        var user = new UserBuilder()
            .WithFullName("Profile Owner")
            .WithEmail("owner@example.com")
            .WithRole(role)
            .Build();

        var usersList = new List<User> { user };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var query = new GetMeQuery(user.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.Email.Should().Be("owner@example.com");
        result.FullName.Should().Be("Profile Owner");
        result.Role.Should().Be(role.ToString());
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenUserDoesNotExist()
    {
        // Arrange
        var usersList = new List<User>();
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var query = new GetMeQuery(Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
