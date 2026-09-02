using FluentAssertions;
using TutorHub.Application.Features.Enrollments.CancelEnrollment;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.CancelEnrollment;

public class CancelEnrollmentCommandValidatorTests
{
    private readonly CancelEnrollmentCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenValidCommand_Passes()
    {
        var command = new CancelEnrollmentCommand(Guid.NewGuid(), Guid.NewGuid(), "Valid cancellation reason.");
        var result = _validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenEnrollmentIdEmpty_Fails()
    {
        var command = new CancelEnrollmentCommand(Guid.NewGuid(), Guid.Empty, "Valid cancellation reason.");
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EnrollmentId");
    }

    [Theory]
    [InlineData("")]
    [InlineData("    ")]
    [InlineData("abc")] // Too short (< 5 chars)
    public void Validate_WhenReasonInvalid_Fails(string reason)
    {
        var command = new CancelEnrollmentCommand(Guid.NewGuid(), Guid.NewGuid(), reason);
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Fact]
    public void Validate_WhenReasonExceeds500Chars_Fails()
    {
        var longReason = new string('a', 501);
        var command = new CancelEnrollmentCommand(Guid.NewGuid(), Guid.NewGuid(), longReason);
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }
}
