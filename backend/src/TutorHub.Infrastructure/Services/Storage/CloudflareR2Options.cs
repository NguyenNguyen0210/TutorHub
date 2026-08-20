namespace TutorHub.Infrastructure.Services.Storage;

public class CloudflareR2Options
{
    public const string SectionName = "CloudflareR2";

    public string AccountId { get; set; } = default!;
    public string BucketName { get; set; } = "tutorhub-media";
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public int PresignedUrlExpirationMinutes { get; set; } = 15;

    public string ServiceUrl => !string.IsNullOrWhiteSpace(AccountId)
        ? $"https://{AccountId}.r2.cloudflarestorage.com"
        : string.Empty;
}
