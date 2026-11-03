using FluentValidation;
using TutorHub.Application.Common.Files;

namespace TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;

public class UploadDisputeEvidenceCommandValidator : AbstractValidator<UploadDisputeEvidenceCommand>
{

    public UploadDisputeEvidenceCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Content).NotNull();

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("File size must be greater than 0.")
            .LessThanOrEqualTo(UploadLimits.EvidenceMaxBytes).WithMessage("File size cannot exceed 10MB.");

    }
}
