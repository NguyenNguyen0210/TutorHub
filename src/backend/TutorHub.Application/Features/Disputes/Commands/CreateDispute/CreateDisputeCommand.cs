using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.CreateDispute;

public record CreateDisputeCommand(
    Guid SessionId,
    Guid InitiatorUserId,
    DisputeReason Reason,
    string Description
) : IRequest<DisputeDto>;
