using Amazon.Runtime;
using Amazon.S3;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TutorHub.Infrastructure.Services.Storage;

namespace TutorHub.Infrastructure.UnitTests.Storage;

public class CloudflareR2PresignedUrlTests
{
    [Fact]
    public async Task UploadUrl_SignsTheRequiredContentLength()
    {
        using var client = new AmazonS3Client(
            new BasicAWSCredentials("test-key", "test-secret"),
            new AmazonS3Config
            {
                ServiceURL = "https://example.r2.cloudflarestorage.com",
                ForcePathStyle = true,
                AuthenticationRegion = "auto",
                SignatureVersion = "4"
            });
        var storage = new CloudflareR2ObjectStorageService(
            client,
            Options.Create(new CloudflareR2Options { BucketName = "test-bucket" }),
            NullLogger<CloudflareR2ObjectStorageService>.Instance);

        var url = await storage.GenerateUploadUrlAsync(
            "general/user/image.png", "image/png", 12345, TimeSpan.FromMinutes(15));

        Uri.UnescapeDataString(url).Should().Contain("content-length");
    }
}
