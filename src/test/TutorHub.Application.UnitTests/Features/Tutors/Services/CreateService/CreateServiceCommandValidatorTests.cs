using FluentValidation.TestHelper;
using TutorHub.Application.Features.Tutors.Services.CreateService;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.CreateService;

public class CreateServiceCommandValidatorTests
{
    private readonly CreateServiceCommandValidator _validator = new();

    private static CreateServiceCommand ValidCommand(
        string? shortDescription = null,
        string[]? tags = null,
        string? coverImageUrl = null)
    {
        return new CreateServiceCommand(
            SubjectId: Guid.NewGuid(),
            Title: "Comprehensive Algebra 101",
            Description: "10 structured lessons covering high school algebra.",
            ShortDescription: shortDescription,
            Tags: tags,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            Price: 3500000m,
            TeachingMode: TeachingMode.Online,
            TrialLessonUrl: null,
            CoverImageUrl: coverImageUrl
        );
    }

    [Fact]
    public void Validate_WhenShortDescriptionExceeds200Characters_ShouldHaveValidationError()
    {
        var command = ValidCommand(shortDescription: new string('a', 201));
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.ShortDescription);
    }

    [Fact]
    public void Validate_WhenShortDescriptionWithin200Characters_ShouldNotHaveValidationError()
    {
        var command = ValidCommand(shortDescription: new string('a', 200));
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor(x => x.ShortDescription);
    }

    [Fact]
    public void Validate_WhenMoreThan10Tags_ShouldHaveValidationError()
    {
        var tags = Enumerable.Range(1, 11).Select(i => $"tag{i}").ToArray();
        var command = ValidCommand(tags: tags);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Tags);
    }

    [Fact]
    public void Validate_WhenTagExceeds30Characters_ShouldHaveValidationError()
    {
        var command = ValidCommand(tags: new[] { new string('a', 31) });
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Tags);
    }

    [Fact]
    public void Validate_WhenTagsAreWithinLimits_ShouldNotHaveValidationError()
    {
        var command = ValidCommand(tags: new[] { "algebra", "exam-prep" });
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor(x => x.Tags);
    }

    [Fact]
    public void Validate_WhenCoverImageUrlExceeds1000Characters_ShouldHaveValidationError()
    {
        var command = ValidCommand(coverImageUrl: "https://example.com/" + new string('a', 1000));
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.CoverImageUrl);
    }

    [Fact]
    public void Validate_WhenCoverImageUrlIsNull_ShouldNotHaveValidationError()
    {
        var command = ValidCommand();
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor(x => x.CoverImageUrl);
    }
}
