using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services.Storage;

public sealed class CloudflareR2ObjectStorageService : IObjectStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly CloudflareR2Options _options;
    private readonly ILogger<CloudflareR2ObjectStorageService> _logger;

    public CloudflareR2ObjectStorageService(
        IAmazonS3 s3Client,
        IOptions<CloudflareR2Options> options,
        ILogger<CloudflareR2ObjectStorageService> logger)
    {
        _s3Client = s3Client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<StoredFileResult> UploadAsync(
        Stream stream,
        string objectKey,
        string contentType,
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

    public async Task<Stream> DownloadAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        var getRequest = new GetObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey
        };

        var response = await _s3Client.GetObjectAsync(getRequest, cancellationToken);
        return response.ResponseStream;
    }

    public async Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey
        };

        await _s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
        _logger.LogInformation("File deleted from Cloudflare R2: Bucket={Bucket}, Key={Key}", _options.BucketName, objectKey);
    }

    public async Task<bool> ExistsAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var metaRequest = new GetObjectMetadataRequest
            {
                BucketName = _options.BucketName,
                Key = objectKey
            };

            var response = await _s3Client.GetObjectMetadataAsync(metaRequest, cancellationToken);
            return response.HttpStatusCode == HttpStatusCode.OK;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public Task<string> GenerateDownloadUrlAsync(
        string objectKey,
        TimeSpan expiration,
        CancellationToken cancellationToken = default)
    {
        var preSignedUrlRequest = new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(expiration)
        };

        var preSignedUrl = _s3Client.GetPreSignedURL(preSignedUrlRequest);
        return Task.FromResult(preSignedUrl);
    }

    public Task<string> GenerateUploadUrlAsync(
        string objectKey,
        string contentType,
        TimeSpan expiration,
        CancellationToken cancellationToken = default)
    {
        var preSignedUrlRequest = new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.Add(expiration)
        };

        var preSignedUrl = _s3Client.GetPreSignedURL(preSignedUrlRequest);
        return Task.FromResult(preSignedUrl);
    }
}
