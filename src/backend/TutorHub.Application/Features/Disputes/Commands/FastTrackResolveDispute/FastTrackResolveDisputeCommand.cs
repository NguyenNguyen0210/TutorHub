using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Commands.FastTrackResolveDispute;

/// <summary>
/// Fast-track template resolution for one-sided-silence disputes (Q1a).
/// Applies only to pre-release escrow sessions where exactly one side submitted
/// Attended, the other stayed silent for more than 3 days past the verification
/// due date, and at least one evidence was uploaded.
/// </summary>
public record FastTrackResolveDisputeCommand(
    Guid DisputeId,
    string AdminNotes
) : IRequest<DisputeDto>;
