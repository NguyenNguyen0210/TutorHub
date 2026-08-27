using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Services.Storage;

public class CloudflareR2Options
{
    public const string SectionName = "CloudflareR2";

    [Required(ErrorMessage = "Cloudflare R2 AccountId is required.")]
    public string AccountId { get; set; } = default!;

    [Required(ErrorMessage = "Cloudflare R2 BucketName is required.")]
    public string BucketName { get; set; } = default!;

    [Required(ErrorMessage = "Cloudflare R2 AccessKeyId is required.")]
    public string AccessKeyId { get; set; } = default!;

    [Required(ErrorMessage = "Cloudflare R2 SecretAccessKey is required.")]
    public string SecretAccessKey { get; set; } = default!;

    [Range(1, 1440, ErrorMessage = "Presigned URL expiration must be between 1 and 1440 minutes.")]
    public int PresignedUrlExpirationMinutes { get; set; } = 15;

    public string ServiceUrl => !string.IsNullOrWhiteSpace(AccountId)
        ? $"https://{AccountId}.r2.cloudflarestorage.com"
        : string.Empty;
}
