using MediatR;
using TutorHub.Application.Features.Admin.Tutors.DTOs;

namespace TutorHub.Application.Features.Admin.Tutors.RejectTutor;

public record RejectTutorCommand(
    Guid TutorProfileId,
    Guid AdminId,
    string Reason
) : IRequest<AdminTutorDto>;
