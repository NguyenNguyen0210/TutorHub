using System.Text;
using FluentAssertions;
using TutorHub.Application.Common.Files;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Application.Features.Tutors.Services.CreateService;
using TutorHub.Application.Features.Tutors.Services.UpdateService;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Media;

public class ServiceDemoVideoValidationTests
{
    private static readonly byte[] Mp4Header =
    [
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32
    ];

    [Fact]
    public void Mp4SignatureIsDetectedAndRenamedNonVideoIsRejected()
    {
        using var real = new MemoryStream(Mp4Header);
        FileSignatureValidator.IsValidSignature(real, ".mp4", out var mime).Should().BeTrue();
        mime.Should().Be("video/mp4");

        using var disguised = new MemoryStream(Encoding.ASCII.GetBytes("%PDF-1.7 not a video"));
        FileSignatureValidator.IsValidSignature(disguised, ".mp4", out _).Should().BeFalse();

        // QuickTime containers must not pass as MP4.
        using var quickTime = new MemoryStream([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20]);
        FileSignatureValidator.IsValidSignature(quickTime, ".mp4", out _).Should().BeFalse();
    }

    [Theory]
    [InlineData("demo.mp4", UploadLimits.ServiceDemoVideoMaxBytes, true)]
    [InlineData("DEMO.MP4", 1024, true)]
    [InlineData("demo.mov", 1024, false)]
    [InlineData("demo.mp4", UploadLimits.ServiceDemoVideoMaxBytes + 1, false)]
    public void UploadValidatorAllowsOnlyMp4WithinTheVideoBudget(string name, long size, bool valid)
    {
        using var stream = new MemoryStream(Mp4Header);
        var result = new UploadMediaCommandValidator()
            .Validate(new UploadMediaCommand(stream, name, "video/mp4", size, MediaType.ServiceDemoVideo));
        result.IsValid.Should().Be(valid);
    }

    [Fact]
    public void UploadValidatorKeepsTheFiveMegabyteBudgetForEveryOtherPurpose()
    {
        using var stream = new MemoryStream(Mp4Header);
        var result = new UploadMediaCommandValidator()
            .Validate(new UploadMediaCommand(stream, "demo.mp4", "video/mp4", UploadLimits.ServiceDemoVideoMaxBytes, MediaType.General));
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("/api/v1/media/3f2504e0-4f89-41d3-9a0c-0305e82c3301/demo-video", true)]
    [InlineData("https://api.tutorhub.vn/api/v1/media/3f2504e0-4f89-41d3-9a0c-0305e82c3301/demo-video", true)]
    [InlineData("/api/v1/media/3f2504e0-4f89-41d3-9a0c-0305e82c3301/cover", false)]
    [InlineData("https://youtube.com/watch?v=abcdefghijk", false)]
    [InlineData("/api/v1/media/not-a-guid/demo-video", false)]
    [InlineData(null, true)]
    public void ServiceAcceptsOnlyOurOwnPlaybackEndpoint(string? url, bool valid)
    {
        ServiceDemoVideoUrl.IsValid(url).Should().Be(valid);
    }

    [Fact]
    public void ServiceValidatorsRejectOffPlatformVideoLinks()
    {
        var external = CreateCommand("https://example.com/demo.mp4");
        new CreateServiceCommandValidator().Validate(external)
            .Errors.Should().Contain(e => e.PropertyName == nameof(CreateServiceCommand.TrialVideoUrl));

        var internalUrl = CreateCommand("https://api.tutorhub.vn/api/v1/media/3f2504e0-4f89-41d3-9a0c-0305e82c3301/demo-video");
        new CreateServiceCommandValidator().Validate(internalUrl).IsValid.Should().BeTrue();

        var update = new UpdateServiceCommand(
            ServiceId: Guid.NewGuid(), Title: null, Description: null, ShortDescription: null, Tags: null,
            LearningScope: null, ExpectedOutcome: null, TotalSessions: null, SessionDurationMinutes: null,
            Price: null, TrialLessonUrl: null, TrialVideoUrl: "https://youtu.be/abcdefghijk", CoverImageUrl: null);
        new UpdateServiceCommandValidator().Validate(update)
            .Errors.Should().Contain(e => e.PropertyName == nameof(UpdateServiceCommand.TrialVideoUrl));
    }

    private static CreateServiceCommand CreateCommand(string? trialVideoUrl) => new(
        SubjectId: Guid.NewGuid(),
        Title: "Comprehensive Algebra 101",
        Description: "10 structured lessons covering high school algebra.",
        ShortDescription: null,
        Tags: null,
        LearningScope: null,
        ExpectedOutcome: null,
        TotalSessions: 10,
        SessionDurationMinutes: 60,
        Price: 3500000m,
        TrialLessonUrl: null,
        TrialVideoUrl: trialVideoUrl,
        CoverImageUrl: null);
}
