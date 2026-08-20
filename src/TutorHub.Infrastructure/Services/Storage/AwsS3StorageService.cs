using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services.Storage;

public class AwsS3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly AwsS3Options _options;
    private readonly ILogger<AwsS3StorageService> _logger;

    public AwsS3StorageService(
        IOptions<AwsS3Options> options,
        ILogger<AwsS3StorageService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _s3Client = CreateS3Client(_options);
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
            ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
        };

        if (!isPrivate)
        {
            putRequest.CannedACL = S3CannedACL.PublicRead;
        }

        var response = await _s3Client.PutObjectAsync(putRequest, cancellationToken);

        _logger.LogInformation("File uploaded to S3: Bucket={Bucket}, Key={Key}, ETag={ETag}",
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
        _logger.LogInformation("File deleted from S3: Bucket={Bucket}, Key={Key}", _options.BucketName, objectKey);
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
        if (!string.IsNullOrWhiteSpace(_options.CloudFrontDomain))
        {
            return $"https://{_options.CloudFrontDomain.TrimEnd('/')}/{objectKey}";
        }

        if (!string.IsNullOrWhiteSpace(_options.ServiceUrl))
        {
            return $"{_options.ServiceUrl.TrimEnd('/')}/{_options.BucketName}/{objectKey}";
        }

        return $"https://{_options.BucketName}.s3.{_options.Region}.amazonaws.com/{objectKey}";
    }

    private static IAmazonS3 CreateS3Client(AwsS3Options options)
    {
        var config = new AmazonS3Config();

        if (!string.IsNullOrWhiteSpace(options.ServiceUrl))
        {
            config.ServiceURL = options.ServiceUrl;
            config.ForcePathStyle = options.ForcePathStyle;
        }
        else if (!string.IsNullOrWhiteSpace(options.Region))
        {
            config.RegionEndpoint = RegionEndpoint.GetBySystemName(options.Region);
        }

        if (!string.IsNullOrWhiteSpace(options.AccessKey) && !string.IsNullOrWhiteSpace(options.SecretKey))
        {
            var credentials = new BasicAWSCredentials(options.AccessKey, options.SecretKey);
            return new AmazonS3Client(credentials, config);
        }

        // Use AWS Default Credential Provider Chain (IAM Role on EC2/ECS/EKS or Environment Variables)
        return new AmazonS3Client(config);
    }
}
