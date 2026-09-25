using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.PauseService;

public record PauseServiceCommand(
    Guid ServiceId
) : IRequest<ServiceDto>;
