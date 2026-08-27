using MediatR;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.UpdateSubject;

public record UpdateSubjectCommand(
    Guid Id,
    string Name,
    Guid CategoryId,
    bool IsActive = true
) : IRequest<AdminSubjectDto>;
