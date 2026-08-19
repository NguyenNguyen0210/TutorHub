using MediatR;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.CreateSubject;

public record CreateSubjectCommand(
    string Name,
    Guid CategoryId
) : IRequest<AdminSubjectDto>;
