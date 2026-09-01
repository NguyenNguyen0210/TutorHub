using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.GetMyServices;

public record GetMyServicesQuery(
    Guid UserId,
    ServiceStatus? Status = null
) : IRequest<List<ServiceDto>>;
