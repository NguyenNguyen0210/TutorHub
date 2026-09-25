using FluentValidation.TestHelper;
using TutorHub.Application.Features.Tutors.Services.CreateService;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.CreateService;

public class CreateServiceCommandValidatorTests
{
    private readonly CreateServiceCommandValidator _validator = new();

    private static CreateServiceCommand ValidCommand(
        string? shortDescription = null,
        string[]? tags = null,
        string? coverImageUrl = null,
        List<CurriculumItemInput>? curriculum = null,
        List<string>? targetAudience = null,
        List<string>? prerequisites = null,
        List<FaqInput>? faqs = null)
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
            CoverImageUrl: coverImageUrl,
            Curriculum: curriculum,
            TargetAudience: targetAudience,
            Prerequisites: prerequisites,
            Faqs: faqs
        );
    }

    private static List<CurriculumItemInput> ValidCurriculum(int count = 2) =>
        Enumerable.Range(1, count)
            .Select(i => new CurriculumItemInput(
                SessionIndex: i,
                Title: $"Session {i}",
                Description: $"What we cover in session {i}.",
                KeyTopics: new List<string> { "Topic A", "Topic B" },
                DurationMinutes: 60))
            .ToList();

    private static List<FaqInput> ValidFaqs(int count = 2) =>
        Enumerable.Range(1, count)
            .Select(i => new FaqInput(Question: $"Question {i}?", Answer: $"Answer {i}."))
            .ToList();

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

    [Fact]
    public void Validate_WhenContentFieldsAreNull_ShouldNotHaveValidationError()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenCurriculumIsValid_ShouldNotHaveValidationError()
    {
        var command = ValidCommand(
            curriculum: ValidCurriculum(),
            targetAudience: new List<string> { "Beginners", "Exam takers" },
            prerequisites: new List<string> { "Basic algebra" },
            faqs: ValidFaqs());
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenCurriculumItemOmitsDuration_ShouldNotHaveValidationError()
    {
        var command = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "Intro")
        });
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor(x => x.Curriculum);
    }

    [Fact]
    public void Validate_WhenCurriculumExceedsTotalSessions_ShouldHaveValidationError()
    {
        var command = ValidCommand(curriculum: ValidCurriculum(count: 11));
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Curriculum);
    }

    [Fact]
    public void Validate_WhenCurriculumSessionIndexesAreDuplicated_ShouldHaveValidationError()
    {
        var command = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "First"),
            new(SessionIndex: 1, Title: "Second")
        });
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Curriculum);
    }

    [Fact]
    public void Validate_WhenCurriculumSessionIndexIsZero_ShouldHaveValidationError()
    {
        var command = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 0, Title: "First")
        });
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Curriculum[0].SessionIndex");
    }

    [Fact]
    public void Validate_WhenCurriculumSessionIndexExceedsTotalSessions_ShouldHaveValidationError()
    {
        var command = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 11, Title: "Beyond total")
        });
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Curriculum);
    }

    [Fact]
    public void Validate_WhenCurriculumTitleIsMissingOrTooLong_ShouldHaveValidationError()
    {
        var missing = ValidCommand(curriculum: new List<CurriculumItemInput> { new(SessionIndex: 1, Title: "") });
        _validator.TestValidate(missing).ShouldHaveValidationErrorFor("Curriculum[0].Title");

        var tooLong = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: new string('a', 201))
        });
        _validator.TestValidate(tooLong).ShouldHaveValidationErrorFor("Curriculum[0].Title");
    }

    [Fact]
    public void Validate_WhenCurriculumDescriptionTooLong_ShouldHaveValidationError()
    {
        var command = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "First", Description: new string('a', 2001))
        });
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Curriculum[0].Description");
    }

    [Fact]
    public void Validate_WhenKeyTopicsExceedLimits_ShouldHaveValidationError()
    {
        var tooMany = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "First",
                KeyTopics: Enumerable.Range(1, 9).Select(i => $"topic{i}").ToList())
        });
        _validator.TestValidate(tooMany).ShouldHaveValidationErrorFor("Curriculum[0].KeyTopics");

        var tooLong = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "First", KeyTopics: new List<string> { new string('a', 101) })
        });
        _validator.TestValidate(tooLong).ShouldHaveValidationErrorFor("Curriculum[0].KeyTopics[0]");
    }

    [Theory]
    [InlineData(29)]
    [InlineData(241)]
    public void Validate_WhenCurriculumDurationOutOfRange_ShouldHaveValidationError(int duration)
    {
        var command = ValidCommand(curriculum: new List<CurriculumItemInput>
        {
            new(SessionIndex: 1, Title: "First", DurationMinutes: duration)
        });
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Curriculum[0].DurationMinutes");
    }

    [Fact]
    public void Validate_WhenTargetAudienceExceedsLimits_ShouldHaveValidationError()
    {
        var tooMany = ValidCommand(targetAudience: Enumerable.Range(1, 9).Select(i => $"aud{i}").ToList());
        _validator.TestValidate(tooMany).ShouldHaveValidationErrorFor(x => x.TargetAudience);

        var tooLong = ValidCommand(targetAudience: new List<string> { new string('a', 201) });
        _validator.TestValidate(tooLong).ShouldHaveValidationErrorFor(x => x.TargetAudience);
    }

    [Fact]
    public void Validate_WhenPrerequisitesExceedLimits_ShouldHaveValidationError()
    {
        var tooMany = ValidCommand(prerequisites: Enumerable.Range(1, 9).Select(i => $"pre{i}").ToList());
        _validator.TestValidate(tooMany).ShouldHaveValidationErrorFor(x => x.Prerequisites);

        var tooLong = ValidCommand(prerequisites: new List<string> { new string('a', 201) });
        _validator.TestValidate(tooLong).ShouldHaveValidationErrorFor(x => x.Prerequisites);
    }

    [Fact]
    public void Validate_WhenFaqsExceedLimits_ShouldHaveValidationError()
    {
        var tooMany = ValidCommand(faqs: ValidFaqs(count: 11));
        _validator.TestValidate(tooMany).ShouldHaveValidationErrorFor(x => x.Faqs);

        var missingQuestion = ValidCommand(faqs: new List<FaqInput> { new(Question: "", Answer: "Answer.") });
        _validator.TestValidate(missingQuestion).ShouldHaveValidationErrorFor("Faqs[0].Question");

        var longAnswer = ValidCommand(faqs: new List<FaqInput>
        {
            new(Question: "Q?", Answer: new string('a', 2001))
        });
        _validator.TestValidate(longAnswer).ShouldHaveValidationErrorFor("Faqs[0].Answer");
    }
}
