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
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("File name is required.")
            .Must(HaveValidExtension).WithMessage("File extension is not allowed. Allowed: .jpg, .jpeg, .png, .webp, .pdf");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Content-Type is required.")
            .Must(ct => AllowedContentTypes.Contains(ct)).WithMessage("Unsupported MIME type.");

        RuleFor(x => x)
            .Must(x => !x.EstimatedSize.HasValue || x.MediaType != MediaType.Avatar || x.EstimatedSize.Value <= UploadLimits.MediaAvatarMaxBytes)
            .WithMessage("Avatar file size must not exceed 5MB.");

        RuleFor(x => x)
            .Must(x => !x.EstimatedSize.HasValue || x.EstimatedSize.Value <= UploadLimits.MediaPresignedMaxBytes)
            .WithMessage("File size must not exceed 20MB.");
    }

    private static bool HaveValidExtension(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        var ext = Path.GetExtension(fileName);
        return !string.IsNullOrEmpty(ext) && AllowedExtensions.Contains(ext);
    }
}
