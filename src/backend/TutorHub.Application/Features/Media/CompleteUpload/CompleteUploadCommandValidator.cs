using FluentValidation;

namespace TutorHub.Application.Features.Media.CompleteUpload;

public class CompleteUploadCommandValidator : AbstractValidator<CompleteUploadCommand>
{
    public CompleteUploadCommandValidator()
    {
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
