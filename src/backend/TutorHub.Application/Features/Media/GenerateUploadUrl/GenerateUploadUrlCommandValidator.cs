using FluentValidation;
using TutorHub.Application.Common.Files;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GenerateUploadUrl;

public class GenerateUploadUrlCommandValidator : AbstractValidator<GenerateUploadUrlCommand>
{
    private static readonly HashSet<string> AllowedExtensions = new(UploadLimits.MediaExtensions, StringComparer.OrdinalIgnoreCase);

    private static readonly HashSet<string> AllowedContentTypes = new(UploadLimits.MediaMimeTypes, StringComparer.OrdinalIgnoreCase);

    public GenerateUploadUrlCommandValidator()
    {
        RuleFor(x => x.MediaType).IsInEnum();
        RuleFor(x => x.FileName)
            .Must(name => UploadLimits.PublicImageExtensions.Contains(Path.GetExtension(name ?? ""), StringComparer.OrdinalIgnoreCase))
            .When(x => x.MediaType is MediaType.Avatar or MediaType.ServiceCover)
            .WithMessage("Public images must be JPG, PNG or WebP images.");
        RuleFor(x => x.ContentType)
            .Must(ct => UploadLimits.PublicImageMimeTypes.Contains(ct, StringComparer.OrdinalIgnoreCase))
            .When(x => x.MediaType is MediaType.Avatar or MediaType.ServiceCover)
            .WithMessage("Public images require an image MIME type.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("File name is required.")
            .Must(HaveValidExtension).WithMessage("File extension is not allowed. Allowed: .jpg, .jpeg, .png, .webp, .pdf");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Content-Type is required.")
            .Must(ct => AllowedContentTypes.Contains(ct)).WithMessage("Unsupported MIME type.");

        RuleFor(x => x.EstimatedSize)
            .GreaterThan(0).WithMessage("File size must be greater than 0.")
            .LessThanOrEqualTo(UploadLimits.MediaPresignedMaxBytes)
            .WithMessage("File size must not exceed 20MB.");

        RuleFor(x => x)
            .Must(x => x.MediaType != MediaType.Avatar || x.EstimatedSize <= UploadLimits.MediaAvatarMaxBytes)
            .WithMessage("Avatar file size must not exceed 5MB.");
    }

    private static bool HaveValidExtension(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        var ext = Path.GetExtension(fileName);
        return !string.IsNullOrEmpty(ext) && AllowedExtensions.Contains(ext);
    }
}
