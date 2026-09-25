using FluentAssertions;
using FluentValidation.TestHelper;
using TutorHub.Application.Features.Reviews.ReportReview;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.ReportReview;

public class ReportReviewCommandValidatorTests
{
    private readonly ReportReviewCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenReviewIdIsEmpty_ShouldHaveValidationError()
    {
        var command = new ReportReviewCommand(Guid.Empty, "Valid description", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.ReviewId);
    }

    [Fact]
    public void Validate_WhenDescriptionIsEmpty_ShouldHaveValidationError()
    {
        var command = new ReportReviewCommand(Guid.NewGuid(), "", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void Validate_WhenEvidenceUrlExceeds500Characters_ShouldHaveValidationError()
    {
        var longUrl = "https://example.com/" + new string('a', 500); // 520 chars
        var command = new ReportReviewCommand(Guid.NewGuid(), "Valid description", longUrl);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.EvidenceUrl)
            .WithErrorMessage("Evidence URL must not exceed 500 characters.");
    }

    [Fact]
    public void Validate_WhenEvidenceUrlIsWithin500Characters_ShouldBeValid()
    {
        var validUrl = "https://example.com/evidence.png";
        var command = new ReportReviewCommand(Guid.NewGuid(), "Valid description", validUrl);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor(x => x.EvidenceUrl);
    }
}
