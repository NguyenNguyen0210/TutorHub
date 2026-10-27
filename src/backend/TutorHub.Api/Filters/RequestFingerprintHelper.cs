using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace TutorHub.Api.Filters;

public static class RequestFingerprintHelper
{
    /// <summary>
    /// Computes a deterministic SHA-256 fingerprint from:
    /// HTTP Method + Normalized Path + UserId + SHA256(Body).
    /// </summary>
    public static async Task<string> ComputeHashAsync(
        HttpRequest request,
        Guid? userId,
        CancellationToken cancellationToken = default)
    {
        request.EnableBuffering();

        string bodyText = string.Empty;
        if (request.Body.CanSeek)
        {
            request.Body.Position = 0;
            using var reader = new StreamReader(
                request.Body,
                Encoding.UTF8,
                detectEncodingFromByteOrderMarks: false,
                leaveOpen: true);

            bodyText = await reader.ReadToEndAsync(cancellationToken);
            request.Body.Position = 0;
        }

        var bodyBytes = Encoding.UTF8.GetBytes(bodyText.Trim());
        var bodyHash = SHA256.HashData(bodyBytes);
        var bodyHashHex = Convert.ToHexString(bodyHash);

        var method = request.Method.ToUpperInvariant();
        var normalizedPath = request.Path.Value?.TrimEnd('/')?.ToLowerInvariant() ?? string.Empty;
        var userScope = userId?.ToString("N") ?? "anonymous";

        var rawFingerprint = $"{method}|{normalizedPath}|{userScope}|{bodyHashHex}";
        var fingerprintBytes = Encoding.UTF8.GetBytes(rawFingerprint);

        return Convert.ToHexString(SHA256.HashData(fingerprintBytes)).ToLowerInvariant();
    }
}
