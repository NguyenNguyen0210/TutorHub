using FluentAssertions;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Media;

public class UploadAvatarValidatorTests
{
    [Theory]
    [InlineData("avatar.jpg")]
    [InlineData("avatar.JPEG")]
    [InlineData("avatar.png")]
    [InlineData("avatar.webp")]
    public void Avatar_AcceptsSupportedImageFormats(string name)
    {
        using var stream = new MemoryStream(new byte[10]);
        new UploadMediaCommandValidator().Validate(new UploadMediaCommand(stream, name, "image/jpeg", 10, MediaType.Avatar)).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(MediaType.Avatar, false)]
    [InlineData(MediaType.Certificate, true)]
    public void Pdf_IsAllowedForCertificatesButNotAvatars(MediaType type, bool valid)
    {
        using var stream = new MemoryStream(new byte[10]);
        new UploadMediaCommandValidator().Validate(new UploadMediaCommand(stream, "degree.pdf", "application/pdf", 10, type)).IsValid.Should().Be(valid);
    }
}
