using FluentValidation;
using TutorHub.Application.Common.Files;

namespace TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;

public class UploadDisputeEvidenceCommandValidator : AbstractValidator<UploadDisputeEvidenceCommand>
{
    private static readonly HashSet<string> AllowedMimeTypes = new(UploadLimits.EvidenceMimeTypes, StringComparer.OrdinalIgnoreCase);

    public UploadDisputeEvidenceCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.FileUrl).NotEmpty().MaximumLength(1024);

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("File size must be greater than 0.")
            .LessThanOrEqualTo(UploadLimits.EvidenceMaxBytes).WithMessage("File size cannot exceed 10MB.");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(mime => AllowedMimeTypes.Contains(mime))
            .WithMessage("File type not allowed. Supported formats: JPG, PNG, WEBP, PDF, TXT.");
    }
}
