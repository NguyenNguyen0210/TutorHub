using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.ResumeService;

public record ResumeServiceCommand(
    Guid ServiceId
) : IRequest<ServiceDto>;
