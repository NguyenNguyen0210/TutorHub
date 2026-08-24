using FluentValidation;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GenerateUploadUrl;

public class GenerateUploadUrlCommandValidator : AbstractValidator<GenerateUploadUrlCommand>
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "application/pdf"
    };

    public GenerateUploadUrlCommandValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("File name is required.")
            .Must(HaveValidExtension).WithMessage("File extension is not allowed. Allowed: .jpg, .jpeg, .png, .webp, .pdf");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Content-Type is required.")
            .Must(ct => AllowedContentTypes.Contains(ct)).WithMessage("Unsupported MIME type.");

        RuleFor(x => x)
            .Must(x => x.MediaType != MediaType.Certificate || x.UserRole == UserRole.Tutor || x.UserRole == UserRole.Admin)
            .WithMessage("Only Tutors and Admins can upload certificates.");

        RuleFor(x => x)
            .Must(x => !x.EstimatedSize.HasValue || x.MediaType != MediaType.Avatar || x.EstimatedSize.Value <= 5 * 1024 * 1024)
            .WithMessage("Avatar file size must not exceed 5MB.");

        RuleFor(x => x)
            .Must(x => !x.EstimatedSize.HasValue || x.EstimatedSize.Value <= 20 * 1024 * 1024)
            .WithMessage("File size must not exceed 20MB.");
    }

    private static bool HaveValidExtension(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        var ext = Path.GetExtension(fileName);
        return !string.IsNullOrEmpty(ext) && AllowedExtensions.Contains(ext);
    }
}
