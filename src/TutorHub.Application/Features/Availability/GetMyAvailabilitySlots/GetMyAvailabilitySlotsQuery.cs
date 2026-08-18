using MediatR;
using TutorHub.Application.Features.Availability.DTOs;

namespace TutorHub.Application.Features.Availability.GetMyAvailabilitySlots;

public record GetMyAvailabilitySlotsQuery(Guid UserId) : IRequest<List<AvailabilitySlotDto>>;
