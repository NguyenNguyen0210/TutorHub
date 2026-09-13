using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;

public record AdminResolveDisputeCommand(
    Guid DisputeId,
    DisputeResolutionDecision Decision,
    decimal? CustomRefundAmount,
    string AdminNotes
) : IRequest<DisputeDto>;
