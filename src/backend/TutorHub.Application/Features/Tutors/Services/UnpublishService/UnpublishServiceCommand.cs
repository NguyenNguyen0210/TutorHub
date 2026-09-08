using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.UnpublishService;

public record UnpublishServiceCommand(
    Guid ServiceId,
    Guid UserId
) : IRequest<ServiceDto>;
