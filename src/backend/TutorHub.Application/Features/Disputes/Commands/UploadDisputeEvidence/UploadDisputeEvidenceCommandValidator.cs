using FluentValidation;

namespace TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;

public class UploadDisputeEvidenceCommandValidator : AbstractValidator<UploadDisputeEvidenceCommand>
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "text/plain"
    };

    public UploadDisputeEvidenceCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
        RuleFor(x => x.UploadedByUserId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.FileUrl).NotEmpty().MaximumLength(1024);

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("File size must be greater than 0.")
            .LessThanOrEqualTo(10 * 1024 * 1024).WithMessage("File size cannot exceed 10MB.");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(mime => AllowedMimeTypes.Contains(mime))
            .WithMessage("File type not allowed. Supported formats: JPG, PNG, WEBP, PDF, TXT.");
    }
}
