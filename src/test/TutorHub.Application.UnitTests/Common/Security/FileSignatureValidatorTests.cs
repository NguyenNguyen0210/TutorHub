using System.IO;
using FluentAssertions;
using TutorHub.Application.Common.Security;
using Xunit;

namespace TutorHub.Application.UnitTests.Common.Security;

public class FileSignatureValidatorTests
{
    [Fact]
    public void IsValidSignature_JpegSignature_ShouldReturnTrueAndMime()
    {
        // Arrange - JPEG header magic bytes: FF D8 FF + padding
        var jpegBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01 };
        using var stream = new MemoryStream(jpegBytes);

        // Act
        var isValid = FileSignatureValidator.IsValidSignature(stream, ".jpg", out var detectedMime);

        // Assert
        isValid.Should().BeTrue();
        detectedMime.Should().Be("image/jpeg");
    }

    [Fact]
    public void IsValidSignature_PngSignature_ShouldReturnTrueAndMime()
    {
        // Arrange - PNG header magic bytes: 89 50 4E 47 + padding
        var pngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        using var stream = new MemoryStream(pngBytes);

        // Act
        var isValid = FileSignatureValidator.IsValidSignature(stream, ".png", out var detectedMime);

        // Assert
        isValid.Should().BeTrue();
        detectedMime.Should().Be("image/png");
    }

    [Fact]
    public void IsValidSignature_InvalidHeader_ShouldReturnFalse()
    {
        // Arrange - Executable header MZ (4D 5A) disguised as .jpg
        var exeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(exeBytes);

        // Act
        var isValid = FileSignatureValidator.IsValidSignature(stream, ".jpg", out var detectedMime);

        // Assert
        isValid.Should().BeFalse();
        detectedMime.Should().Be("application/octet-stream");
    }
}
