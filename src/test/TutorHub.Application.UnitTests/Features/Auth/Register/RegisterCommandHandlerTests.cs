using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.Register;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.Register;

public class RegisterCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        _handler = new RegisterCommandHandler(
            _contextMock.Object,
            _passwordHasherMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldRegisterStudent_WhenRequestIsValid()
    {
        // Arrange
        const string rawPassword = "StudentPassword123!";
        const string hashedPassword = "$2a$11$mocked_student_hashed_password";

        var usersList = new List<User>();
        var studentProfilesList = new List<StudentProfile>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(studentProfilesList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _passwordHasherMock
            .Setup(h => h.HashPassword(rawPassword))
            .Returns(hashedPassword);

        var command = new RegisterCommand("newstudent@example.com", rawPassword, "Nguyen Van A", "0987654321", UserRole.Student);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("newstudent@example.com");
        result.FullName.Should().Be("Nguyen Van A");
        result.Role.Should().Be("Student");

        // Verify side effects
        usersList.Should().ContainSingle(u => u.Email == "newstudent@example.com");
        var createdUser = usersList.Single();

        // Password security contract: Never stored in plaintext
        createdUser.PasswordHash.Should().NotBe(rawPassword);
        createdUser.PasswordHash.Should().Be(hashedPassword);
        createdUser.Status.Should().Be(AccountStatus.Active);

        studentProfilesList.Should().ContainSingle(s => s.UserId == createdUser.Id);
        _passwordHasherMock.Verify(h => h.HashPassword(rawPassword), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldRegisterTutor_WithoutCreatingProfileOrWallet_WhenRequestIsValid()
    {
        // Arrange
        const string rawPassword = "TutorPassword123!";
        const string hashedPassword = "$2a$11$mocked_tutor_hashed_password";

        var usersList = new List<User>();
        var tutorProfilesList = new List<TutorProfile>();
        var walletsList = new List<Wallet>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(tutorProfilesList).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(walletsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _passwordHasherMock
            .Setup(h => h.HashPassword(rawPassword))
            .Returns(hashedPassword);

        var command = new RegisterCommand("newtutor@example.com", rawPassword, "Tran Thi B", "0912345678", UserRole.Tutor);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Role.Should().Be("Tutor");

        // Verify side effects: User is created with Active status, but no TutorProfile and no Wallet
        usersList.Should().ContainSingle(u => u.Email == "newtutor@example.com");
        var createdUser = usersList.Single();
        createdUser.Status.Should().Be(AccountStatus.Active);
        createdUser.Role.Should().Be(UserRole.Tutor);

        tutorProfilesList.Should().BeEmpty();
        walletsList.Should().BeEmpty();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("existing@example.com")]
    [InlineData("EXISTING@example.com")] // Case-insensitivity check
    public async Task Handle_ShouldThrowConflictException_WhenEmailAlreadyExists(string inputEmail)
    {
        // Arrange
        var existingUser = new UserBuilder()
            .WithEmail("existing@example.com")
            .Build();

        var usersList = new List<User> { existingUser };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new RegisterCommand(inputEmail, "Password123!", "Nguyen Van C", null, UserRole.Student);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Conflict);

        // Verify no side effects occurred
        usersList.Should().HaveCount(1);
        _passwordHasherMock.Verify(h => h.HashPassword(It.IsAny<string>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
