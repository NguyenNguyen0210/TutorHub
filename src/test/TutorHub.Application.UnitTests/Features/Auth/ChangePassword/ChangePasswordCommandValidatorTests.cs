using FluentAssertions;
using TutorHub.Application.Features.Auth.ChangePassword;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.ChangePassword;

public class ChangePasswordCommandValidatorTests
{
    private readonly ChangePasswordCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldPassValidation()
    {
        // Arrange
        var command = new ChangePasswordCommand(Guid.NewGuid(), "OldPassword123!", "NewPassword456!");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenUserIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new ChangePasswordCommand(Guid.Empty, "OldPassword123!", "NewPassword456!");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(ChangePasswordCommand.UserId));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_WhenCurrentPasswordIsEmpty_ShouldHaveValidationError(string emptyCurrentPassword)
    {
        // Arrange
        var command = new ChangePasswordCommand(Guid.NewGuid(), emptyCurrentPassword, "NewPassword456!");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(ChangePasswordCommand.CurrentPassword));
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")] // Less than 6 chars
    public void Validate_WhenNewPasswordIsInvalid_ShouldHaveValidationError(string invalidNewPassword)
    {
        // Arrange
        var command = new ChangePasswordCommand(Guid.NewGuid(), "OldPassword123!", invalidNewPassword);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(ChangePasswordCommand.NewPassword));
    }

    [Fact]
    public void Validate_WhenNewPasswordEqualsCurrentPassword_ShouldHaveValidationError()
    {
        // Arrange
        var command = new ChangePasswordCommand(Guid.NewGuid(), "SamePassword123!", "SamePassword123!");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(ChangePasswordCommand.NewPassword));
    }
}
