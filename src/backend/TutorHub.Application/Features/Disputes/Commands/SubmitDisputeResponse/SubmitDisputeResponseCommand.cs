using FluentValidation;
using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Commands.SubmitDisputeResponse;

public record SubmitDisputeResponseCommand(Guid DisputeId, Guid SubmissionId, string Content) : IRequest<DisputeResponseDto>;

public class SubmitDisputeResponseCommandValidator : AbstractValidator<SubmitDisputeResponseCommand>
{
    public SubmitDisputeResponseCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
        RuleFor(x => x.SubmissionId).NotEmpty();
        RuleFor(x => x.Content).NotEmpty().Must(x => x != null && x.Trim().Length >= 20)
            .WithMessage("Nội dung giải trình cần ít nhất 20 ký tự.").MaximumLength(10000);
    }
}
