namespace TutorHub.Infrastructure.Services.Storage;

public class AwsS3Options
{
    public const string SectionName = "AwsS3";

    public string BucketName { get; set; } = "tutorhub-media";
    public string Region { get; set; } = "ap-southeast-1";
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
    public string? ServiceUrl { get; set; }
    public string? CloudFrontDomain { get; set; }
    public bool ForcePathStyle { get; set; } = false;
    public int PresignedUrlExpirationMinutes { get; set; } = 15;
}
