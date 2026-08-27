namespace TutorHub.Application.Common.Security;

public static class FileSignatureValidator
{
    private static readonly byte[] JpegHeader = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47];
    private static readonly byte[] PdfHeader = [0x25, 0x50, 0x44, 0x46]; // %PDF
    private static readonly byte[] RiffHeader = [0x52, 0x49, 0x46, 0x46]; // RIFF
    private static readonly byte[] WebpHeader = [0x57, 0x45, 0x42, 0x50]; // WEBP

    public static bool IsValidSignature(Stream stream, string extension, out string detectedMime)
    {
        detectedMime = "application/octet-stream";

        if (stream == null || stream.Length < 12)
        {
            return false;
        }

        var initialPosition = stream.Position;
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        var header = new byte[12];
        var bytesRead = stream.Read(header, 0, header.Length);

        // Reset position back
        if (stream.CanSeek)
        {
            stream.Position = initialPosition;
        }

        if (bytesRead < 4)
        {
            return false;
        }

        var ext = extension.ToLowerInvariant().TrimStart('.');

        // 1. Check JPEG
        if (header[0] == JpegHeader[0] && header[1] == JpegHeader[1] && header[2] == JpegHeader[2])
        {
            detectedMime = "image/jpeg";
            return ext is "jpg" or "jpeg";
        }

        // 2. Check PNG
        if (header[0] == PngHeader[0] && header[1] == PngHeader[1] && header[2] == PngHeader[2] && header[3] == PngHeader[3])
        {
            detectedMime = "image/png";
            return ext is "png";
        }

        // 3. Check PDF
        if (header[0] == PdfHeader[0] && header[1] == PdfHeader[1] && header[2] == PdfHeader[2] && header[3] == PdfHeader[3])
        {
            detectedMime = "application/pdf";
            return ext is "pdf";
        }

        // 4. Check WEBP (RIFF....WEBP)
        if (bytesRead >= 12 &&
            header[0] == RiffHeader[0] && header[1] == RiffHeader[1] && header[2] == RiffHeader[2] && header[3] == RiffHeader[3] &&
            header[8] == WebpHeader[0] && header[9] == WebpHeader[1] && header[10] == WebpHeader[2] && header[11] == WebpHeader[3])
        {
            detectedMime = "image/webp";
            return ext is "webp";
        }

        return false;
    }
}
