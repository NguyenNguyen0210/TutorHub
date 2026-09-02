using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.PublishService;

public record PublishServiceCommand(
    Guid ServiceId,
    Guid UserId
) : IRequest<ServiceDto>;
