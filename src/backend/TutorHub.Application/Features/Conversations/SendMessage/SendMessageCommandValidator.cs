using FluentValidation;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Conversations.SendMessage;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty()
            .WithMessage("ConversationId is required.");

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Content) || !string.IsNullOrWhiteSpace(x.AttachmentKey))
            .WithMessage("Message must contain either text content or an attachment.");

        RuleFor(x => x.Content)
            .MaximumLength(4000)
            .WithMessage("Message content cannot exceed 4000 characters.");

        When(x => !string.IsNullOrWhiteSpace(x.AttachmentKey), () =>
        {
            RuleFor(x => x.AttachmentSize)
                .NotNull()
                .LessThanOrEqualTo(IFileStorage.MaxAttachmentSizeBytes)
                .WithMessage($"Attachment size cannot exceed {IFileStorage.MaxAttachmentSizeBytes / (1024 * 1024)} MB.");

            RuleFor(x => x.AttachmentContentType)
                .NotEmpty()
                .Must(ct => ct != null && IFileStorage.AllowedMimeTypes.Contains(ct.ToLowerInvariant()))
                .WithMessage("Attachment type is not supported.");
        });
    }
}
