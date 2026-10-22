using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.GetTutorBusySlots;

public record GetTutorBusySlotsQuery(
    Guid TutorProfileId,
    DateTime? From = null,
    DateTime? To = null
) : IRequest<IReadOnlyList<TutorBusySlotDto>>;

