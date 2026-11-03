using FluentValidation;
using TutorHub.Application.Common.Files;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.UploadMedia;

public class UploadMediaCommandValidator : AbstractValidator<UploadMediaCommand>
{
    private const long MaxFileSizeInBytes = UploadLimits.MediaMaxBytes;
    private static readonly string[] AllowedExtensions = UploadLimits.MediaExtensions;

    public UploadMediaCommandValidator()
    {
        RuleFor(x => x.MediaType).IsInEnum();
        RuleFor(x => x.OriginalFileName)
            .Must(name => new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(Path.GetExtension(name ?? "").ToLowerInvariant()))
            .When(x => x.MediaType is MediaType.Avatar or MediaType.ServiceCover)
            .WithMessage("Public images must be JPG, PNG or WebP images.");
        RuleFor(x => x.Stream)
            .NotNull()
            .WithMessage("File stream cannot be null.");

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .WithMessage("File cannot be empty.")
            .LessThanOrEqualTo(MaxFileSizeInBytes)
            .WithMessage("File size exceeds the maximum allowed limit of 5MB.");

        RuleFor(x => x.OriginalFileName)
            .NotEmpty()
            .WithMessage("Original file name is required.")
            .Must(HaveAllowedExtension)
            .WithMessage("File extension is not supported. Allowed formats: .jpg, .jpeg, .png, .webp, .pdf.");
    }

    private static bool HaveAllowedExtension(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return AllowedExtensions.Contains(ext);
    }
}
