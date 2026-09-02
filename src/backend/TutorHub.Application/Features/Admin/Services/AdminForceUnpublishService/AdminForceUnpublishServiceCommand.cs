using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Admin.Services.AdminForceUnpublishService;

public record AdminForceUnpublishServiceCommand(
    Guid ServiceId,
    Guid AdminId
) : IRequest<ServiceDto>;
