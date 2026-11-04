using FluentValidation;
using TutorHub.Application.Common.Files;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.CompleteUpload;

public class CompleteUploadCommandValidator : AbstractValidator<CompleteUploadCommand>
{
    public CompleteUploadCommandValidator()
    {
        RuleFor(x => x.MediaType).IsInEnum();
        RuleFor(x => x.OriginalFileName)
            .Must(name => UploadLimits.PublicImageExtensions.Contains(Path.GetExtension(name ?? ""), StringComparer.OrdinalIgnoreCase))
            .When(x => x.MediaType is MediaType.Avatar or MediaType.ServiceCover)
            .WithMessage("Public images must be JPG, PNG or WebP images.");

        RuleFor(x => x.ObjectKey)
            .NotEmpty().WithMessage("Object key is required.");

        RuleFor(x => x.OriginalFileName)
            .NotEmpty().WithMessage("Original file name is required.");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Content-Type is required.");

        RuleFor(x => x.FileSize)
            .GreaterThan(0).WithMessage("File size must be greater than 0.");
    }
}
