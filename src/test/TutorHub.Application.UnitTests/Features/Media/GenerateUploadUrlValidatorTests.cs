using FluentAssertions;
using TutorHub.Application.Common.Files;
using TutorHub.Application.Features.Media.GenerateUploadUrl;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Media;

public class GenerateUploadUrlValidatorTests
{
    [Theory]
    [InlineData(0L)]
    [InlineData(-1L)]
    public void MissingOrInvalidSize_IsRejected(long size)
    {
        var result = new GenerateUploadUrlCommandValidator().Validate(
            new GenerateUploadUrlCommand("photo.png", "image/png", size, MediaType.General));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void OversizedFile_IsRejectedBeforeSigning()
    {
        var result = new GenerateUploadUrlCommandValidator().Validate(
            new GenerateUploadUrlCommand("photo.png", "image/png", UploadLimits.MediaPresignedMaxBytes + 1, MediaType.General));
        result.IsValid.Should().BeFalse();
    }
}
