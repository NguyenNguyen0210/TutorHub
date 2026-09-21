using FluentAssertions;
using TutorHub.Application.Features.Sessions.CancelSession;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.CancelSession;

public class CancelSessionCommandValidatorTests
{
    private readonly CancelSessionCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenValidCommand_Passes()
    {
        var command = new CancelSessionCommand(Guid.NewGuid(), "Valid cancellation reason.");
        var result = _validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenSessionIdEmpty_Fails()
    {
        var command = new CancelSessionCommand(Guid.Empty, "Valid cancellation reason.");
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "SessionId");
    }

    [Theory]
    [InlineData("")]
    [InlineData("    ")]
    public void Validate_WhenReasonInvalid_Fails(string reason)
    {
        var command = new CancelSessionCommand(Guid.NewGuid(), reason);
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Fact]
    public void Validate_WhenReasonExceeds500Chars_Fails()
    {
        var longReason = new string('a', 501);
        var command = new CancelSessionCommand(Guid.NewGuid(), longReason);
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }
}
