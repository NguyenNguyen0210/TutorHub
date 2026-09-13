using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.GetMyServiceById;

public record GetMyServiceByIdQuery(
    Guid ServiceId
) : IRequest<ServiceDto>;
