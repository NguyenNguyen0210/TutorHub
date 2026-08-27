using MediatR;
using TutorHub.Application.Features.Availability.DTOs;

namespace TutorHub.Application.Features.Availability.GetTutorAvailability;

public record GetTutorAvailabilityQuery(
    Guid TutorProfileId,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null
) : IRequest<TutorAvailabilityDto>;
