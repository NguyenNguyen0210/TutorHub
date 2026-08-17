using MediatR;
using TutorHub.Application.Features.Admin.Tutors.DTOs;

namespace TutorHub.Application.Features.Admin.Tutors.ApproveTutor;

public record ApproveTutorCommand(
    Guid TutorProfileId,
    Guid AdminId
) : IRequest<AdminTutorDto>;
