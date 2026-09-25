using FluentValidation.TestHelper;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Application.Features.Tutors.Services.UpdateService;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandValidatorTests
{
    private readonly UpdateServiceCommandValidator _validator = new();

    private static UpdateServiceCommand ValidCommand(
        string? shortDescription = null,
        string[]? tags = null,
        string? coverImageUrl = null,
        List<CurriculumItemInput>? curriculum = null,
        List<string>? targetAudience = null,
        List<string>? prerequisites = null,
        List<FaqInput>? faqs = null,
        int? totalSessions = null)
    {
        return new UpdateServiceCommand(
            ServiceId: Guid.NewGuid(),
            Title: null,
            Description: null,
            ShortDescription: shortDescription,
            Tags: tags,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: totalSessions,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null,
            CoverImageUrl: coverImageUrl,
            Curriculum: curriculum,
            TargetAudience: targetAudience,
            Prerequisites: prerequisites,
            Faqs: faqs
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

    [Fact]
    public void Validate_WhenCurriculumIsValid_ShouldNotHaveValidationError()
    {
        var command = ValidCommand(
            curriculum: new List<CurriculumItemInput>
            {
                new(SessionIndex: 1, Title: "Intro", DurationMinutes: 90),
                new(SessionIndex: 2, Title: "Deep dive")
            },
            targetAudience: new List<string> { "Beginners" },
            prerequisites: new List<string> { "Basic algebra" },
            faqs: new List<FaqInput> { new(Question: "Q?", Answer: "A.") },
            totalSessions: 10);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenCurriculumExceedsSuppliedTotalSessions_ShouldHaveValidationError()
    {
        var command = ValidCommand(
            curriculum: new List<CurriculumItemInput>
            {
                new(SessionIndex: 1, Title: "One"),
                new(SessionIndex: 2, Title: "Two"),
                new(SessionIndex: 3, Title: "Three")
            },
            totalSessions: 2);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Curriculum);
    }

    [Fact]
    public void Validate_WhenCurriculumItemIsInvalid_ShouldHaveValidationError()
    {
        var duplicateIndex = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "One"),
            new(SessionIndex: 1, Title: "Two")
        });
        _validator.TestValidate(duplicateIndex).ShouldHaveValidationErrorFor(x => x.Curriculum);

        var badDuration = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "One", DurationMinutes: 20)
        });
        _validator.TestValidate(badDuration).ShouldHaveValidationErrorFor("Curriculum[0].DurationMinutes");
    }

    [Fact]
    public void Validate_WhenAudiencePrerequisitesOrFaqsExceedLimits_ShouldHaveValidationError()
    {
        var tooManyAudience = ValidCommand(targetAudience: Enumerable.Range(1, 9).Select(i => $"aud{i}").ToList());
        _validator.TestValidate(tooManyAudience).ShouldHaveValidationErrorFor(x => x.TargetAudience);

        var tooManyPrereqs = ValidCommand(prerequisites: Enumerable.Range(1, 9).Select(i => $"pre{i}").ToList());
        _validator.TestValidate(tooManyPrereqs).ShouldHaveValidationErrorFor(x => x.Prerequisites);

        var tooManyFaqs = ValidCommand(faqs: Enumerable.Range(1, 11).Select(i => new FaqInput($"Q{i}?", $"A{i}")).ToList());
        _validator.TestValidate(tooManyFaqs).ShouldHaveValidationErrorFor(x => x.Faqs);

        var emptyAnswer = ValidCommand(faqs: new List<FaqInput> { new(Question: "Q?", Answer: "") });
        _validator.TestValidate(emptyAnswer).ShouldHaveValidationErrorFor("Faqs[0].Answer");
    }
}
