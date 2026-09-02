using MediatR;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;

namespace TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;

public record ApproveTutorApplicationCommand(
    Guid ApplicationId,
    Guid AdminId
) : IRequest<AdminTutorApplicationDto>;
