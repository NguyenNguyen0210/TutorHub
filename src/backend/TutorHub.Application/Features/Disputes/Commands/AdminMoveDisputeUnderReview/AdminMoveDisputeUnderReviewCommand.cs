using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Commands.AdminMoveDisputeUnderReview;

public record AdminMoveDisputeUnderReviewCommand(
    Guid DisputeId,
    Guid AdminUserId
) : IRequest<DisputeDto>;
