using MediatR;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;

namespace TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;

public record RejectTutorApplicationCommand(
    Guid ApplicationId,
    Guid AdminId,
    string Reason
) : IRequest<AdminTutorApplicationDto>;
