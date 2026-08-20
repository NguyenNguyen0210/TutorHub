using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services.Storage;

public class CloudflareR2StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly CloudflareR2Options _options;
    private readonly ILogger<CloudflareR2StorageService> _logger;

    public CloudflareR2StorageService(
        IOptions<CloudflareR2Options> options,
        ILogger<CloudflareR2StorageService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _s3Client = CreateR2Client(_options);
    }

    public async Task<StoredFileResult> UploadAsync(
        Stream stream,
        string objectKey,
        string contentType,
        bool isPrivate,
        CancellationToken cancellationToken = default)
    {
        var putRequest = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false,
            DisablePayloadSigning = true // Recommended for Cloudflare R2
        };

        var response = await _s3Client.PutObjectAsync(putRequest, cancellationToken);

        _logger.LogInformation("File uploaded to Cloudflare R2: Bucket={Bucket}, Key={Key}, ETag={ETag}",
            _options.BucketName, objectKey, response.ETag);

        return new StoredFileResult(
            ObjectKey: objectKey,
            Size: stream.Length,
            ContentType: contentType,
            ETag: response.ETag
        );
    }

    public async Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey
        };

        await _s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
        _logger.LogInformation("File deleted from Cloudflare R2: Bucket={Bucket}, Key={Key}", _options.BucketName, objectKey);
    }

    public Task<string> GetReadUrlAsync(
        string objectKey,
        TimeSpan expiresIn,
        CancellationToken cancellationToken = default)
    {
        var preSignedUrlRequest = new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(expiresIn)
        };

        var preSignedUrl = _s3Client.GetPreSignedURL(preSignedUrlRequest);
        return Task.FromResult(preSignedUrl);
    }

    public string GetPublicUrl(string objectKey)
    {
        return $"https://{_options.BucketName}.{_options.AccountId}.r2.cloudflarestorage.com/{objectKey}";
    }

    private static IAmazonS3 CreateR2Client(CloudflareR2Options options)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = options.ServiceUrl,
            ForcePathStyle = true,
            AuthenticationRegion = "auto"
        };

        if (!string.IsNullOrWhiteSpace(options.AccessKeyId) && !string.IsNullOrWhiteSpace(options.SecretAccessKey))
        {
            var credentials = new BasicAWSCredentials(options.AccessKeyId, options.SecretAccessKey);
            return new AmazonS3Client(credentials, config);
        }

        // Fallback for local initialization
        return new AmazonS3Client(new AnonymousAWSCredentials(), config);
    }
}
