using FluentAssertions;
using TutorHub.Application.Features.Auth.Register;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.Register;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldPassValidation()
    {
        // Arrange
        var command = new RegisterCommand("student@example.com", "Password123!", "Nguyen Van A", "0987654321", UserRole.Student);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("invalid-email")]
    [InlineData("plainaddress")]
    [InlineData("@missingusername.com")]
    [InlineData("missingdomain@")]
    public void Validate_WhenEmailIsInvalid_ShouldHaveValidationError(string invalidEmail)
    {
        // Arrange
        var command = new RegisterCommand(invalidEmail, "Password123!", "Nguyen Van A", null, UserRole.Student);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RegisterCommand.Email));
    }

    [Theory]
    [InlineData(4, false)] // Below min length
    [InlineData(5, false)] // Boundary: just below min length 6
    [InlineData(6, true)]  // Boundary: exactly min length 6
    [InlineData(7, true)]  // Boundary: just above min length 6
    [InlineData(20, true)]
    public void Validate_PasswordLengthBoundaries_ShouldBehaveConsistently(int length, bool shouldBeValid)
    {
        // Arrange
        var testPassword = new string('a', length);
        var command = new RegisterCommand("valid@example.com", testPassword, "Nguyen Van A", null, UserRole.Student);

        // Act
        var result = _validator.Validate(command);

        // Assert
        if (shouldBeValid)
        {
            result.Errors.Should().NotContain(x => x.PropertyName == nameof(RegisterCommand.Password));
        }
        else
        {
            result.Errors.Should().Contain(x => x.PropertyName == nameof(RegisterCommand.Password));
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_WhenFullNameIsEmpty_ShouldHaveValidationError(string emptyFullName)
    {
        // Arrange
        var command = new RegisterCommand("valid@example.com", "Password123!", emptyFullName, null, UserRole.Student);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RegisterCommand.FullName));
    }

    [Fact]
    public void Validate_WhenRoleIsAdmin_ShouldHaveValidationError()
    {
        // Arrange - Direct registration as Admin is forbidden
        var command = new RegisterCommand("admin@example.com", "Password123!", "Admin User", null, UserRole.Admin);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RegisterCommand.Role));
    }

    [Theory]
    [InlineData(UserRole.Student)]
    [InlineData(UserRole.Tutor)]
    public void Validate_WhenRoleIsStudentOrTutor_ShouldPassValidation(UserRole validRole)
    {
        // Arrange
        var command = new RegisterCommand("valid@example.com", "Password123!", "Test User", null, validRole);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
