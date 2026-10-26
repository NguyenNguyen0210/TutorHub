using MediatR;

namespace TutorHub.Application.Features.Admin.Subjects.DeleteSubject;

public record DeleteSubjectCommand(
    Guid Id,
    string? Reason = null
) : IRequest<Unit>;
