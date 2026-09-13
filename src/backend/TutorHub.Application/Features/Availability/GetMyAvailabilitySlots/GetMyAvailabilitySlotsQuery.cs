using MediatR;
using TutorHub.Application.Features.Availability.DTOs;

namespace TutorHub.Application.Features.Availability.GetMyAvailabilitySlots;

public record GetMyAvailabilitySlotsQuery : IRequest<List<AvailabilitySlotDto>>;
