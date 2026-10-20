using FluentAssertions;
using FluentValidation.TestHelper;
using TutorHub.Application.Features.Auth.Register;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.Register;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    [Theory]
    [InlineData("0912345678")]
    [InlineData("0312345678")]
    [InlineData("0512345678")]
    [InlineData("0712345678")]
    [InlineData("0812345678")]
    [InlineData("+84912345678")]
    [InlineData("84912345678")]
    [InlineData("091 234 5678")]
    [InlineData("091-234-5678")]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_WhenPhoneIsValidOrEmpty_ShouldNotHaveValidationError(string? phone)
    {
        // Arrange
        var command = new RegisterCommand("user@example.com", "Password123!", "Nguyen Van A", phone, UserRole.Student);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Phone);
    }

    [Theory]
    [InlineData("dâfaf")]
    [InlineData("abc")]
    [InlineData("0912345")]
    [InlineData("0123456789")]
    [InlineData("1234567890")]
    [InlineData("091234567890123")]
    public void Validate_WhenPhoneIsInvalid_ShouldHaveValidationError(string phone)
    {
        // Arrange
        var command = new RegisterCommand("user@example.com", "Password123!", "Nguyen Van A", phone, UserRole.Student);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Phone)
            .WithErrorMessage("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại di động Việt Nam (VD: 0912345678, +84912345678).");
    }

    [Fact]
    public void Validate_WhenEmailIsEmpty_ShouldHaveValidationError()
    {
        var command = new RegisterCommand("", "Password123!", "Nguyen Van A", null, UserRole.Student);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_WhenPasswordTooShort_ShouldHaveValidationError()
    {
        var command = new RegisterCommand("user@example.com", "123", "Nguyen Van A", null, UserRole.Student);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}
