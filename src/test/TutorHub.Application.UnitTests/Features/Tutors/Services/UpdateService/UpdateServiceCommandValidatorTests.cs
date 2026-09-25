using FluentValidation.TestHelper;
using TutorHub.Application.Features.Tutors.Services.UpdateService;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandValidatorTests
{
    private readonly UpdateServiceCommandValidator _validator = new();

    private static UpdateServiceCommand ValidCommand(
        string? shortDescription = null,
        string[]? tags = null,
        string? coverImageUrl = null)
    {
        return new UpdateServiceCommand(
            ServiceId: Guid.NewGuid(),
            Title: null,
            Description: null,
            ShortDescription: shortDescription,
            Tags: tags,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
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
    public void Validate_WhenCoverImageUrlExceeds1000Characters_ShouldHaveValidationError()
    {
        var command = ValidCommand(coverImageUrl: "https://example.com/" + new string('a', 1000));
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.CoverImageUrl);
    }

    [Fact]
    public void Validate_WhenNewFieldsAreNull_ShouldNotHaveValidationError()
    {
        var command = ValidCommand();
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
