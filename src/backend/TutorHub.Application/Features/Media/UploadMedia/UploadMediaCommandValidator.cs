using FluentValidation;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.UploadMedia;

public class UploadMediaCommandValidator : AbstractValidator<UploadMediaCommand>
{
    private const long MaxFileSizeInBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    public UploadMediaCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("UserId is required.");

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

        RuleFor(x => x)
            .Must(HaveValidRoleForMediaType)
            .WithMessage("You do not have permission to upload certificates. Only Tutors and Admins can upload certificates.");
    }

    private static bool HaveAllowedExtension(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return AllowedExtensions.Contains(ext);
    }

    private static bool HaveValidRoleForMediaType(UploadMediaCommand command)
    {
        if (command.MediaType == MediaType.Certificate)
        {
            return command.UserRole is UserRole.Tutor or UserRole.Admin;
        }

        return true;
    }
}
