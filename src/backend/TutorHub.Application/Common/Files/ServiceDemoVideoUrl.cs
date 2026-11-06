using System.Text.RegularExpressions;

namespace TutorHub.Application.Common.Files;

/// <summary>
/// Validates the stored demo-video pointer. Only the public media playback
/// endpoint is accepted, so a service can never point at an arbitrary
/// off-platform URL (which is what the legacy trial-lesson link allowed).
/// </summary>
public static partial class ServiceDemoVideoUrl
{
    [GeneratedRegex(
        @"^/api/v1/media/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/demo-video/?$",
        RegexOptions.CultureInvariant)]
    private static partial Regex PlaybackPathPattern();

    /// <summary>Empty/null is valid (video is optional).</summary>
    public static bool IsValid(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (url.Length > 1000) return false;
        if (!Uri.TryCreate(url, UriKind.RelativeOrAbsolute, out var uri)) return false;

        var path = uri.IsAbsoluteUri ? uri.AbsolutePath : uri.OriginalString;
        return PlaybackPathPattern().IsMatch(path);
    }
}
