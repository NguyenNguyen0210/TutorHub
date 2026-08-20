using MediatR;
using TutorHub.Application.Features.Admin.Tutors.DTOs;

namespace TutorHub.Application.Features.Admin.Tutors.SuspendTutor;

public record SuspendTutorCommand(
    Guid TutorProfileId,
    Guid AdminId,
    string Reason
) : IRequest<AdminTutorDto>;
