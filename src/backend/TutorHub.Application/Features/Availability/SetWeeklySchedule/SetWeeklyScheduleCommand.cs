using MediatR;
using TutorHub.Application.Features.Availability.DTOs;

namespace TutorHub.Application.Features.Availability.SetWeeklySchedule;

public record SetWeeklyScheduleCommand(
    Guid UserId,
    List<WeeklyScheduleItemDto> Schedule
) : IRequest<List<AvailabilitySlotDto>>;
