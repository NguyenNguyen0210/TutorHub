using MediatR;
using TutorHub.Application.Features.Availability.DTOs;

namespace TutorHub.Application.Features.Availability.CreateAvailabilitySlot;

public record CreateAvailabilitySlotCommand(
    Guid UserId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime
) : IRequest<AvailabilitySlotDto>;
