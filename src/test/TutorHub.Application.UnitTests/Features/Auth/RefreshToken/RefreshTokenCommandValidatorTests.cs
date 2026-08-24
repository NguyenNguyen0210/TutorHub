using FluentAssertions;
using TutorHub.Application.Features.Auth.RefreshToken;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.RefreshToken;

public class RefreshTokenCommandValidatorTests
{
    private readonly RefreshTokenCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenTokenIsProvided_ShouldPassValidation()
    {
        // Arrange
        var command = new RefreshTokenCommand("valid-sample-refresh-token-string");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_WhenTokenIsEmpty_ShouldHaveValidationError(string emptyToken)
    {
        // Arrange
        var command = new RefreshTokenCommand(emptyToken);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == nameof(RefreshTokenCommand.RefreshToken));
    }
}
