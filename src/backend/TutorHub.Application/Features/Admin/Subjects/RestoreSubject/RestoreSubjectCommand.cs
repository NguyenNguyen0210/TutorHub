using MediatR;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.RestoreSubject;

public record RestoreSubjectCommand(
    Guid Id
) : IRequest<AdminSubjectDto>;
