using MediatR;

namespace TutorHub.Application.Features.Availability.DeleteAvailabilitySlot;

public record DeleteAvailabilitySlotCommand(
    Guid SlotId,
    Guid UserId
) : IRequest<bool>;
